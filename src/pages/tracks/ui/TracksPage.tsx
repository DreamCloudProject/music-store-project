import type { InfiniteData } from "@tanstack/react-query";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { z } from "zod";

import { mapCmsTracks, type Track } from "@/entities/track";
import { useFavoriteSellerSkuIdsQuery } from "@/features/toggle-track-favorite";
import { chunkList } from "@/shared/lib";
import { toPlayerBarTrack, usePlaybackStore } from "@/widgets/player-bar";
import { TracksFiltersPanel } from "@/widgets/tracks-filters";
import { TracksTable } from "@/widgets/tracks-table";
import {
  fetchTracksCatalogAll,
  fetchTracksPage,
  filterTracksForUi,
  tracksCatalogCacheTtlMs,
  type CmsSellerSkuItem,
  type TracksPageResponse,
  type TracksUiParams,
} from "@/widgets/tracks-catalog";

/** Данные в кэше запроса — результат `queryFn`, не `select`; массив SKU или страница. */
function catalogCacheToItems(raw: unknown): CmsSellerSkuItem[] | null {
  if (raw == null) return null;
  return ((sku) => {
    const parsed = z
      .union([
        z.array(sku),
        z.object({
          items: z.array(sku),
          nextOffset: z.number().nullable(),
        }),
      ])
      .safeParse(raw);
    if (!parsed.success) return [];
    return Array.isArray(parsed.data) ? parsed.data : parsed.data.items;
  })(
    z.looseObject({
      id: z.string(),
      name: z.string().nullish(),
      searchTerms: z.string().optional(),
      attributeValues: z
        .array(
          z.object({
            attributeId: z.string(),
            value: z.string().nullish(),
          }),
        )
        .optional(),
      favorite: z.boolean().optional(),
      documentURLs: z
        .array(
          z.looseObject({
            url: z.string(),
            name: z.string().optional(),
            type: z.string().optional(),
          }),
        )
        .optional(),
      imageURLs: z.array(z.string()).optional(),
    }),
  );
}

export function TracksPage() {
  const queryClient = useQueryClient();
  const [skipCatalog, setSkipCatalog] = useState(false);
  const currentTrackId = usePlaybackStore((state) => state.currentTrack?.id);
  const selectTrack = usePlaybackStore((state) => state.selectTrack);
  const setQueue = usePlaybackStore((state) => state.setQueue);
  const {
    search: urlSearch,
    artists,
    genres,
    year,
  } = useSearch({
    from: "/_studio/",
  });
  const params = useMemo((): TracksUiParams => {
    const search = urlSearch.trim();
    return { artists, genres, search, year };
  }, [artists, genres, urlSearch, year]);

  const catalogQuery = useQuery({
    queryKey: ["tracks", "catalog-full"],
    enabled: !skipCatalog,
    retry: false,
    queryFn: fetchTracksCatalogAll,
    staleTime: tracksCatalogCacheTtlMs,
    refetchOnWindowFocus: false,
    gcTime: tracksCatalogCacheTtlMs,
  });

  useEffect(() => {
    if (skipCatalog || !catalogQuery.isError) return;
    queryClient.removeQueries({
      queryKey: ["tracks", "catalog-full"],
      exact: true,
    });
    startTransition(() => {
      setSkipCatalog(true);
    });
  }, [catalogQuery.isError, queryClient, skipCatalog]);

  const {
    data: tracks = [],
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery<
    TracksPageResponse,
    Error,
    Track[],
    (string | TracksUiParams)[],
    number
  >({
    queryKey: ["tracks", "paged", params],
    staleTime: tracksCatalogCacheTtlMs,
    refetchOnWindowFocus: false,
    gcTime: tracksCatalogCacheTtlMs,
    initialPageParam: 0,
    select: (infinite) => mapCmsTracks(infinite.pages.flatMap((p) => p.items)),
    queryFn: async ({ pageParam }) => {
      const catalogState = queryClient.getQueryState([
        "tracks",
        "catalog-full",
      ]);
      const catalog = catalogCacheToItems(
        queryClient.getQueryData<unknown>(["tracks", "catalog-full"]),
      );
      if (
        catalogState?.status === "success" &&
        catalog != null &&
        catalog.length > 0
      ) {
        const filtered = filterTracksForUi(catalog, params);
        const limit = 10;
        const items = filtered.slice(pageParam, pageParam + limit);
        const nextOffset =
          pageParam + items.length < filtered.length ? pageParam + limit : null;
        return { items, nextOffset };
      }
      return fetchTracksPage({
        offset: pageParam,
        limit: 10,
        search: params.search,
        artists: params.artists,
        genres: params.genres,
        year: params.year,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });

  const { data: favoriteIds } = useFavoriteSellerSkuIdsQuery();
  const tracksWithFavorites = useMemo(() => {
    if (!favoriteIds) return tracks;
    const ids = new Set(favoriteIds);
    return tracks.map((track) => ({
      ...track,
      favorite: ids.has(track.id),
    }));
  }, [favoriteIds, tracks]);

  useEffect(() => {
    if (isPending) return;
    setQueue(tracksWithFavorites.map(toPlayerBarTrack));
  }, [isPending, setQueue, tracksWithFavorites]);

  useEffect(() => {
    if (skipCatalog || !catalogQuery.isSuccess || !catalogQuery.data?.length) {
      return;
    }
    const filtered = filterTracksForUi(catalogQuery.data, params);
    const limit = 10;
    const chunks = chunkList(filtered, limit);
    queryClient.setQueryData<InfiniteData<TracksPageResponse>>(
      ["tracks", "paged", params],
      {
        pages:
          chunks.length === 0
            ? [{ items: [], nextOffset: null }]
            : chunks.map((items, i) => ({
                items,
                nextOffset:
                  i * limit + items.length < filtered.length
                    ? i * limit + limit
                    : null,
              })),
        pageParams: chunks.length === 0 ? [0] : chunks.map((_, i) => i * limit),
      },
    );
  }, [
    catalogQuery.data,
    catalogQuery.isSuccess,
    params,
    queryClient,
    skipCatalog,
  ]);

  const tryFetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: "200px 0px",
    threshold: 0,
  });

  useEffect(() => {
    if (inView) tryFetchNext();
  }, [inView, tryFetchNext]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (document.documentElement.scrollHeight <= window.innerHeight + 2) {
      fetchNextPage();
    }
  }, [tracks, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <section>
      <h1 className="mb-[49px] text-[3rem] font-semibold leading-[64px]">
        Треки
      </h1>

      <div>
        <TracksFiltersPanel />
      </div>

      {isError ? (
        <p className="mt-6 text-red-500">
          Не удалось загрузить треки
          {error instanceof Error ? `: ${error.message}` : ""}
        </p>
      ) : null}
      {!isError && isFetching && !isFetchingNextPage && !isPending ? (
        <p className="mt-2 text-sm text-white/50">Обновление…</p>
      ) : null}

      {!isError ? (
        <div className="mt-6">
          <TracksTable
            tracks={tracksWithFavorites}
            isPending={isPending}
            isFetchingNextPage={isFetchingNextPage}
            sentinelRef={sentinelRef}
            activeTrackId={currentTrackId}
            onTrackSelect={(track) => selectTrack(toPlayerBarTrack(track))}
          />
        </div>
      ) : null}
    </section>
  );
}

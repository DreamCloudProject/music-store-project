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

import { chunkList } from "@/shared/lib";
import { HeaderSearch } from "@/widgets/header-search";
import { PlayerBar, type PlayerBarTrack } from "@/widgets/player-bar";
import { TracksFiltersPanel } from "@/widgets/tracks-filters";

import {
  fetchTracksCatalogAll,
  fetchTracksPage,
  tracksCatalogCacheTtlMs,
} from "./api/tracks.api";
import type {
  CmsSellerSkuItem,
  TrackListItem,
  TracksPageResponse,
  TracksUiParams,
} from "./api/tracks.types";
import { filterTracksForUi } from "./lib/filter-tracks-for-ui";

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
    }),
  );
}

function App() {
  const queryClient = useQueryClient();
  const [skipCatalog, setSkipCatalog] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<PlayerBarTrack | null>(null);
  const { search: urlSearch, artists, genres, year } = useSearch({ from: "/" });
  const params = useMemo((): TracksUiParams => {
    const search = urlSearch.trim();
    return { artists, genres, search, year };
  }, [artists, genres, urlSearch, year]);

  const catalogQuery = useQuery({
    queryKey: ["tracks", "catalog-full"],
    enabled: !skipCatalog,
    retry: false,
    queryFn: async () => fetchTracksCatalogAll(),
    staleTime: tracksCatalogCacheTtlMs,
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
    TrackListItem[],
    (string | TracksUiParams)[],
    number
  >({
    queryKey: ["tracks", "paged", params],
    staleTime: tracksCatalogCacheTtlMs,
    gcTime: tracksCatalogCacheTtlMs,
    initialPageParam: 0,
    select: (infinite) =>
      z
        .array(
          z
            .looseObject({
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
            })
            .transform((item) => {
              const searchTerms = item.searchTerms?.trim() ?? "";
              const dashIdx = searchTerms.indexOf(" - ");
              const title =
                (dashIdx >= 0
                  ? searchTerms.slice(dashIdx + 3).trim()
                  : searchTerms) ||
                item.name?.trim() ||
                item.id;
              const attributeValue = (attributeId: string) =>
                item.attributeValues
                  ?.find((av) => av.attributeId === attributeId)
                  ?.value?.trim() ?? "";
              return {
                id: item.id,
                title,
                artist: attributeValue("artist"),
                album: attributeValue("album"),
              };
            }),
        )
        .parse(infinite.pages.flatMap((p) => p.items)),
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
    <main className="min-h-screen bg-[#181818] pb-[77px] text-white">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-10">
        <header className="mb-[37px]">
          <div className="w-full">
            <HeaderSearch />
          </div>
        </header>

        <section>
          <h1 className="mb-[49px] text-[3rem] font-semibold leading-[64px]">
            Треки
          </h1>

          <div>
            <TracksFiltersPanel />
          </div>

          {isPending && !isError ? (
            <p className="mt-6 text-white/70">Загрузка...</p>
          ) : null}
          {isError ? (
            <p className="mt-6 text-red-500">
              Не удалось загрузить треки
              {error instanceof Error ? `: ${error.message}` : ""}
            </p>
          ) : null}
          {!isError && isFetching && !isFetchingNextPage && !isPending ? (
            <p className="mt-2 text-sm text-white/50">Обновление…</p>
          ) : null}

          {!isPending && !isError ? (
            <div className="mt-6">
              <ul className="space-y-2 pb-4">
                {tracks.map((track) => {
                  const active = currentTrack?.id === track.id;
                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentTrack({
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                          })
                        }
                        aria-pressed={active}
                        aria-label={`Играть ${track.title} — ${track.artist}`}
                        className={
                          active
                            ? "w-full cursor-pointer rounded-xl border border-white/40 bg-white/10 p-4 text-left"
                            : "w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-white/25"
                        }
                      >
                        <p className="font-semibold">{track.title}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {track.artist} · {track.album}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden />
              {isFetchingNextPage ? (
                <p className="py-2 text-sm text-white/50">Подгрузка…</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <PlayerBar
        track={currentTrack ?? undefined}
        queue={tracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
        }))}
        onTrackChange={setCurrentTrack}
      />
    </main>
  );
}

export default App;

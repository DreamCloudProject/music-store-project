import type { InfiniteData } from "@tanstack/react-query";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { z } from "zod";

import { LogoutButton } from "@/features/auth";
import { chunkList } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { HeaderSearch } from "@/widgets/header-search";
import { PlayerBar, type PlayerBarTrack } from "@/widgets/player-bar";
import { PlaylistsPanel, usePlaylistsQuery } from "@/widgets/playlists";
import { AppMobileNav, AppSidebar } from "@/widgets/sidebar";
import { TracksFiltersPanel } from "@/widgets/tracks-filters";

import {
  fetchTracksCatalogAll,
  fetchTracksPage,
  tracksCatalogCacheTtlMs,
} from "./api/tracks.api";
import type {
  CmsSellerSkuItem,
  Track,
  TracksPageResponse,
  TracksUiParams,
} from "./api/tracks.types";
import { filterTracksForUi } from "./lib/filter-tracks-for-ui";
import { mapSellerSkuToTrack } from "./lib/map-seller-sku-to-track";

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
      embeddedSku: z.looseObject({ id: z.string() }).nullish(),
      attributeValues: z
        .array(
          z.object({
            attributeId: z.string(),
            value: z.string().nullish(),
          }),
        )
        .optional(),
      imageURLs: z.array(z.string()).optional(),
      documentURLs: z.array(z.looseObject({ url: z.string() })).optional(),
    }),
  );
}

function App() {
  const queryClient = useQueryClient();
  const [skipCatalog, setSkipCatalog] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<
    (PlayerBarTrack & { id: string }) | null
  >(null);
  const { playlistId } = useParams({ strict: false }) as {
    playlistId?: string;
  };
  const {
    search: urlSearch,
    artists,
    genres: selectedGenres,
    year,
  } = useSearch({ strict: false }) as {
    search: string;
    artists: string[];
    genres: string[];
    year?: string;
  };
  const { data: playlists = [] } = usePlaylistsQuery();
  const activePlaylist = playlistId
    ? playlists.find((p) => p.id === playlistId)
    : undefined;

  const params = useMemo((): TracksUiParams => {
    const search = urlSearch.trim();
    if (playlistId) {
      return {
        artists: [],
        genres: [],
        search,
        playlistSkuIds: activePlaylist?.skuIds ?? [],
      };
    }
    return {
      artists,
      genres: selectedGenres,
      search,
      year,
      playlistSkuIds: [],
    };
  }, [
    activePlaylist?.skuIds,
    artists,
    playlistId,
    selectedGenres,
    urlSearch,
    year,
  ]);

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
    Track[],
    (string | TracksUiParams)[],
    number
  >({
    queryKey: ["tracks", "paged", params],
    staleTime: tracksCatalogCacheTtlMs,
    gcTime: tracksCatalogCacheTtlMs,
    initialPageParam: 0,
    select: (infinite) =>
      infinite.pages.flatMap((p) => p.items).map(mapSellerSkuToTrack),
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

  const pageTitle = activePlaylist?.title ?? "Треки";
  const showPlaylists = !playlistId;

  return (
    <div className="flex min-h-screen bg-app-bg text-fg">
      <AppSidebar />
      <main
        className={
          currentTrack
            ? "min-w-0 flex-1 px-4 pb-[85px] pt-[23px] md:px-9"
            : "min-w-0 flex-1 px-4 pb-4 pt-[23px] md:px-9"
        }
      >
        <header className="mb-[50px] flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <AppMobileNav />
            <HeaderSearch />
          </div>
          <LogoutButton />
        </header>

        <div className="flex min-w-0">
          <section className="min-w-0 flex-1">
            {playlistId ? (
              <nav className="mb-[51px]" aria-label="Навигация">
                <Button
                  asChild
                  variant="outline"
                  className="h-auto cursor-pointer gap-[3px] rounded-[60px] border-border-strong pt-[5.5px] pb-[9.5px] pl-[10px] pr-[15px] text-base font-normal leading-[1.15] tracking-[0.001em] text-fg shadow-none hover:border-accent-hover hover:bg-transparent hover:text-accent-hover active:border-accent-active active:bg-control-active-bg active:text-accent-active focus-visible:ring-0"
                >
                  <Link
                    to="/"
                    search={{
                      search: urlSearch,
                      artists: [],
                      genres: [],
                      year: undefined,
                    }}
                    aria-label="Вернуться назад"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M10 4 6 8l4 4"
                      />
                    </svg>
                    Назад
                  </Link>
                </Button>
              </nav>
            ) : null}

            <h1 className="mb-[49px] text-[3rem] font-semibold leading-[64px]">
              {pageTitle}
            </h1>

            {showPlaylists ? (
              <TracksFiltersPanel className="mb-0 min-[1300px]:mb-[51px]" />
            ) : null}

            {showPlaylists ? <PlaylistsPanel layout="mobile" /> : null}

            {isPending && !isError ? (
              <p
                className={
                  showPlaylists ? "text-fg-subtle" : "mt-6 text-fg-subtle"
                }
              >
                Загрузка...
              </p>
            ) : null}
            {isError ? (
              <p
                className={showPlaylists ? "text-red-500" : "mt-6 text-red-500"}
              >
                Не удалось загрузить треки
                {error instanceof Error ? `: ${error.message}` : ""}
              </p>
            ) : null}
            {!isError && isFetching && !isFetchingNextPage && !isPending ? (
              <p className="mt-2 text-sm text-fg-subtle">Обновление…</p>
            ) : null}

            {!isPending && !isError ? (
              <div className={showPlaylists ? undefined : "mt-6"}>
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
                              coverUrl: track.coverUrl,
                            })
                          }
                          aria-pressed={active}
                          aria-label={`Играть ${track.title} — ${track.artist}`}
                          className={
                            active
                              ? "w-full cursor-pointer rounded-xl border border-accent-active bg-row-bg p-4 text-left"
                              : "w-full cursor-pointer rounded-xl border border-row-border bg-row-bg p-4 text-left hover:border-border-strong"
                          }
                        >
                          <p className="font-semibold">{track.title}</p>
                          <p className="mt-1 text-sm text-fg-subtle">
                            {track.artist} · {track.album}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden />
                {isFetchingNextPage ? (
                  <p className="py-2 text-sm text-fg-subtle">Подгрузка…</p>
                ) : null}
              </div>
            ) : null}
          </section>

          {showPlaylists ? <PlaylistsPanel layout="desktop" /> : null}
        </div>
      </main>
      {currentTrack ? <PlayerBar track={currentTrack} /> : null}
    </div>
  );
}

export default App;

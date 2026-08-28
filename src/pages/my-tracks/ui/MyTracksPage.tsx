import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { mapCmsTracks } from "@/entities/track";
import { useFavoriteSellerSkuIdsQuery } from "@/features/toggle-track-favorite";
import { toPlayerBarTrack, usePlaybackStore } from "@/widgets/player-bar";
import { fetchTracksByIds } from "@/widgets/tracks-catalog";
import { TracksTable } from "@/widgets/tracks-table";

export function MyTracksPage() {
  const { search: urlSearch } = useSearch({ from: "/_studio/my-tracks" });
  const currentTrackId = usePlaybackStore((state) => state.currentTrack?.id);
  const selectTrack = usePlaybackStore((state) => state.selectTrack);
  const setQueue = usePlaybackStore((state) => state.setQueue);
  const idsQuery = useFavoriteSellerSkuIdsQuery();
  const ids = idsQuery.data ?? [];

  const tracksQuery = useQuery({
    queryKey: ["tracks", "favorites-skus", ids],
    enabled: !idsQuery.isPending || ids.length > 0,
    queryFn: async () => {
      if (!ids.length) return [];
      const page = await fetchTracksByIds(ids);
      const byId = new Map(
        mapCmsTracks(page.items).map((track) => [track.id, track]),
      );
      return ids.flatMap((id) => {
        const track = byId.get(id);
        return track ? [{ ...track, favorite: true }] : [];
      });
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const idsSet = useMemo(() => new Set(ids), [ids]);
  const tracks = useMemo(() => {
    const visible = (tracksQuery.data ?? []).filter((track) =>
      idsSet.has(track.id),
    );
    const needle = urlSearch.trim().toLowerCase();
    if (!needle) return visible;
    return visible.filter((track) =>
      `${track.title}\u0000${track.artist}\u0000${track.album}`
        .toLowerCase()
        .includes(needle),
    );
  }, [idsSet, tracksQuery.data, urlSearch]);

  const isPending =
    (idsQuery.isPending && !ids.length) ||
    (ids.length > 0 && tracksQuery.isPending);
  const isError = idsQuery.isError || tracksQuery.isError;

  useEffect(() => {
    if (isPending || !idsQuery.isSuccess) return;
    setQueue(tracks.map(toPlayerBarTrack));
  }, [idsQuery.isSuccess, isPending, setQueue, tracks]);

  return (
    <section>
      <h1 className="mb-[49px] text-[3rem] font-semibold leading-[64px]">
        Мои треки
      </h1>

      {isError ? (
        <p className="mt-6 text-red-500">Не удалось загрузить избранное</p>
      ) : null}

      {!isError && !isPending && !ids.length ? (
        <p className="mt-6 text-white/50">Пока нет избранных треков</p>
      ) : null}

      {!isError && !isPending && ids.length > 0 && !tracks.length ? (
        <p className="mt-6 text-white/50">Ничего не найдено</p>
      ) : null}

      {!isError && (isPending || tracks.length > 0) ? (
        <div className="mt-6">
          <TracksTable
            tracks={tracks}
            isPending={isPending}
            isFetchingNextPage={false}
            activeTrackId={currentTrackId}
            onTrackSelect={(track) => selectTrack(toPlayerBarTrack(track))}
          />
        </div>
      ) : null}
    </section>
  );
}

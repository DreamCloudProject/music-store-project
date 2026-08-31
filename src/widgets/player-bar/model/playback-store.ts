import { create } from "zustand";

import { pickSiblingTrack } from "../lib/player-queue";
import type { PlayerBarTrack } from "../ui/PlayerBar";

export function toPlayerBarTrack(track: {
  id: string;
  title: string;
  artist: string;
  favorite: boolean;
  audioUrl?: string;
  coverUrl?: string;
}): PlayerBarTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    favorite: track.favorite,
    ...(track.audioUrl ? { audioUrl: track.audioUrl } : {}),
    ...(track.coverUrl ? { coverUrl: track.coverUrl } : {}),
  };
}

interface PlaybackState {
  currentTrack: PlayerBarTrack | null;
  queue: PlayerBarTrack[];
  selectTrack: (track: PlayerBarTrack) => void;
  setQueue: (queue: PlayerBarTrack[]) => void;
  dismiss: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  currentTrack: null,
  queue: [],
  selectTrack: (track) => set({ currentTrack: track }),
  setQueue: (queue) =>
    set((state) => {
      const current = state.currentTrack;
      if (!current) return { queue };
      const still = queue.find((item) => item.id && item.id === current.id);
      if (still) return { queue, currentTrack: still };
      return {
        queue,
        currentTrack: pickSiblingTrack(queue, current, 1, false, false),
      };
    }),
  dismiss: () => set({ currentTrack: null }),
}));

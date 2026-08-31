import { describe, expect, it } from "vitest";

import { toPlayerBarTrack, usePlaybackStore } from "../../model/playback-store";

const catalog = [
  toPlayerBarTrack({
    id: "1",
    title: "One",
    artist: "A",
    favorite: false,
    audioUrl: "https://cdn.example/1.mp3",
  }),
  toPlayerBarTrack({
    id: "2",
    title: "Two",
    artist: "B",
    favorite: true,
    audioUrl: "https://cdn.example/2.mp3",
  }),
];

describe("usePlaybackStore", () => {
  it("keeps the current track when it stays in the page queue", () => {
    usePlaybackStore.setState({ currentTrack: null, queue: [] });
    usePlaybackStore.getState().selectTrack(catalog[0]!);
    usePlaybackStore.getState().setQueue(catalog);
    expect(usePlaybackStore.getState().currentTrack?.id).toBe("1");
  });

  it("switches to a track from the page list when the current one is gone", () => {
    usePlaybackStore.setState({ currentTrack: null, queue: [] });
    usePlaybackStore.getState().selectTrack(catalog[0]!);
    usePlaybackStore.getState().setQueue([catalog[1]!]);
    expect(usePlaybackStore.getState().currentTrack?.id).toBe("2");
  });

  it("dismisses when the page list is empty", () => {
    usePlaybackStore.setState({ currentTrack: null, queue: [] });
    usePlaybackStore.getState().selectTrack(catalog[0]!);
    usePlaybackStore.getState().setQueue([]);
    expect(usePlaybackStore.getState().currentTrack).toBeNull();
  });
});

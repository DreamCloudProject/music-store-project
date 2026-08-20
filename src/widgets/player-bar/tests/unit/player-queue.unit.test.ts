import { describe, expect, it, vi } from "vitest";

import { pickSiblingTrack, trackIndexInQueue } from "../../lib/player-queue";

const queue = [
  { id: "1", title: "One", artist: "A" },
  { id: "2", title: "Two", artist: "B" },
  { id: "3", title: "Three", artist: "C" },
];

describe("trackIndexInQueue", () => {
  it("finds track by id", () => {
    expect(trackIndexInQueue(queue, queue[1]!)).toBe(1);
  });

  it("falls back to title+artist when id missing", () => {
    expect(trackIndexInQueue(queue, { title: "Three", artist: "C" })).toBe(2);
  });
});

describe("pickSiblingTrack", () => {
  it("moves next and previous sequentially", () => {
    expect(pickSiblingTrack(queue, queue[0]!, 1, false, false)).toEqual(
      queue[1],
    );
    expect(pickSiblingTrack(queue, queue[1]!, -1, false, false)).toEqual(
      queue[0],
    );
  });

  it("returns null past edges when repeat is off", () => {
    expect(pickSiblingTrack(queue, queue[2]!, 1, false, false)).toBeNull();
    expect(pickSiblingTrack(queue, queue[0]!, -1, false, false)).toBeNull();
  });

  it("wraps around when repeat is on", () => {
    expect(pickSiblingTrack(queue, queue[2]!, 1, false, true)).toEqual(
      queue[0],
    );
    expect(pickSiblingTrack(queue, queue[0]!, -1, false, true)).toEqual(
      queue[2],
    );
  });

  it("picks another track when shuffle is on", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const next = pickSiblingTrack(queue, queue[0]!, 1, true, false);
    expect(next).not.toEqual(queue[0]);
    expect(queue).toContainEqual(next);
    vi.restoreAllMocks();
  });

  it("with shuffle and one track returns that track only when repeat is on", () => {
    const single = [queue[0]!];
    expect(pickSiblingTrack(single, single[0]!, 1, true, false)).toBeNull();
    expect(pickSiblingTrack(single, single[0]!, 1, true, true)).toEqual(
      single[0],
    );
  });

  it("starts from first item when current track is outside queue", () => {
    expect(
      pickSiblingTrack(
        queue,
        { id: "x", title: "Missing", artist: "Z" },
        1,
        false,
        false,
      ),
    ).toEqual(queue[0]);
  });
});

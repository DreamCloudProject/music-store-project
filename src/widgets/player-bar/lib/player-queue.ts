export type QueueTrack = {
  id?: string;
  title: string;
  artist: string;
};

export function trackIndexInQueue(queue: QueueTrack[], track: QueueTrack) {
  if (track.id) {
    const byId = queue.findIndex((item) => item.id === track.id);
    if (byId >= 0) return byId;
  }
  return queue.findIndex(
    (item) => item.title === track.title && item.artist === track.artist,
  );
}

export function pickSiblingTrack(
  queue: QueueTrack[],
  track: QueueTrack,
  direction: 1 | -1,
  shuffle: boolean,
  repeat: boolean,
): QueueTrack | null {
  if (!queue.length) return null;
  const index = trackIndexInQueue(queue, track);

  if (shuffle) {
    if (queue.length === 1) return repeat ? queue[0] : null;
    let next = index;
    while (next === index) {
      next = Math.floor(Math.random() * queue.length);
    }
    return queue[next] ?? null;
  }

  if (index < 0) return queue[0] ?? null;
  const nextIndex = index + direction;
  if (nextIndex >= 0 && nextIndex < queue.length)
    return queue[nextIndex] ?? null;
  if (!repeat) return null;
  return queue[direction > 0 ? 0 : queue.length - 1] ?? null;
}

import { musicResourceKey, type MusicResourceRef } from "@scopify/music-domain/identity";

export interface PersonalFmQueueItem {
  ref: MusicResourceRef;
}

export function getPersonalFmRemainingCount(queueLength: number, queueIndex: number) {
  return Math.max(0, queueLength - queueIndex - 1);
}

export function selectNewPersonalFmQueueItems<T extends PersonalFmQueueItem>(
  currentQueue: readonly T[],
  incoming: readonly T[],
): T[] {
  const seenIds = new Set(currentQueue.map((item) => musicResourceKey(item.ref)));
  return incoming.filter((item) => {
    const key = musicResourceKey(item.ref);
    if (seenIds.has(key)) return false;
    seenIds.add(key);
    return true;
  });
}

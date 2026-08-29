export interface PersonalFmQueueItem {
  id: number | string;
}

export function getPersonalFmRemainingCount(queueLength: number, queueIndex: number) {
  return Math.max(0, queueLength - queueIndex - 1);
}

export function selectNewPersonalFmQueueItems<T extends PersonalFmQueueItem>(
  currentQueue: readonly T[],
  incoming: readonly T[],
): T[] {
  const seenIds = new Set(currentQueue.map((item) => item.id));
  return incoming.filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });
}

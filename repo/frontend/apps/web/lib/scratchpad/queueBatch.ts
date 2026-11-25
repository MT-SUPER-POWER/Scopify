import { playerTrackKey } from "@/lib/player/trackIdentity";
import type { PlayerTrack } from "@/types/player/model";
import type { ScratchpadQueueBatchAction } from "@/types/scratchpad/model";

/** 将选中的一组下标作为一个整体插入其余条目第 targetIndex 个位置。 */
export function moveBlockToIndex<T>(
  items: readonly T[],
  selectedIndices: readonly number[],
  targetIndex: number,
): T[] {
  const valid = new Set(
    selectedIndices.filter(
      (index) => Number.isInteger(index) && index >= 0 && index < items.length,
    ),
  );
  if (valid.size === 0 || valid.size === items.length) return [...items];

  const moving = items.filter((_, index) => valid.has(index));
  const remaining = items.filter((_, index) => !valid.has(index));
  const insertAt = Math.max(0, Math.min(remaining.length, targetIndex));
  return [...remaining.slice(0, insertAt), ...moving, ...remaining.slice(insertAt)];
}

export interface ScratchpadQueueBatchInput {
  queue: readonly PlayerTrack[];
  targetIndices: readonly number[];
  currentTrack: PlayerTrack | null;
  action: ScratchpadQueueBatchAction;
}

export interface ScratchpadQueueBatchResult {
  nextQueue: PlayerTrack[];
  affectedCount: number;
  changed: boolean;
}

export function applyScratchpadQueueBatch({
  queue,
  targetIndices,
  currentTrack,
  action,
}: ScratchpadQueueBatchInput): ScratchpadQueueBatchResult {
  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const currentIndex = currentKey
    ? queue.findIndex((track) => playerTrackKey(track) === currentKey)
    : -1;

  const uniqueIndices = [
    ...new Set(
      targetIndices.filter(
        (index) => Number.isInteger(index) && index >= 0 && index < queue.length,
      ),
    ),
  ].sort((a, b) => a - b);

  const filteredIndices =
    action === "remove"
      ? uniqueIndices.filter((index) => index !== currentIndex)
      : action === "next"
        ? uniqueIndices.filter((index) => index !== currentIndex)
        : uniqueIndices;

  if (filteredIndices.length === 0) {
    return { nextQueue: [...queue], affectedCount: 0, changed: false };
  }

  const indexSet = new Set(filteredIndices);
  if (action === "remove") {
    const nextQueue = queue.filter((_, index) => !indexSet.has(index));
    return { nextQueue, affectedCount: filteredIndices.length, changed: true };
  }

  const movedItems = filteredIndices.map((index) => queue[index]);
  const remaining = queue.filter((_, index) => !indexSet.has(index));

  if (action === "end") {
    const nextQueue = [...remaining, ...movedItems];
    const changed = nextQueue.some((item, idx) => item !== queue[idx]);
    return { nextQueue, affectedCount: filteredIndices.length, changed };
  }

  // "next": insert directly after currentIndex in the remaining list.
  const currentInRemaining =
    currentIndex >= 0 ? remaining.findIndex((track) => playerTrackKey(track) === currentKey) : -1;
  const insertAt = currentInRemaining >= 0 ? currentInRemaining + 1 : 0;
  const nextQueue = [...remaining.slice(0, insertAt), ...movedItems, ...remaining.slice(insertAt)];
  const changed = nextQueue.some((item, idx) => item !== queue[idx]);
  return { nextQueue, affectedCount: filteredIndices.length, changed };
}

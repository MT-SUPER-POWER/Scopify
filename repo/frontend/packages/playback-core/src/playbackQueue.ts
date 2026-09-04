import type {
  PlaybackQueue,
  PlaybackQueueItem,
  PlaybackQueueSnapshot,
  PlaybackRepeatMode,
  QueueAdvanceReason,
  QueueEffect,
  QueueTransition,
} from "./types";

export interface CreatePlaybackQueueOptions {
  /** Injected so shuffle behaviour stays reproducible in tests. */
  random?: () => number;
}

const NO_EFFECT: QueueEffect = { type: "none" };

function cloneItem(item: PlaybackQueueItem): PlaybackQueueItem {
  return {
    locator: { ...item.locator },
    queueItemId: item.queueItemId,
    track: {
      ...item.track,
      artistNames: [...item.track.artistNames],
    },
  };
}

function cloneSnapshot(snapshot: PlaybackQueueSnapshot): PlaybackQueueSnapshot {
  return {
    ...snapshot,
    items: snapshot.items.map(cloneItem),
  };
}

function clampIndex(index: number, length: number): number {
  if (length === 0) return -1;
  return Math.max(0, Math.min(Math.trunc(index), length - 1));
}

/**
 * Pure queue transition engine. It deliberately does not resolve sources or
 * start audio: PlaybackSession consumes its effects and performs those side
 * effects in one place.
 */
class DefaultPlaybackQueue implements PlaybackQueue {
  private currentItemId: string | null = null;
  private historyCursor = -1;
  private historyItemIds: string[] = [];
  private items: PlaybackQueueItem[] = [];
  private repeatMode: PlaybackRepeatMode = "off";
  private shuffleEnabled = false;
  private shuffleOrder: string[] = [];

  constructor(private readonly random: () => number) {}

  enqueue(items: readonly PlaybackQueueItem[], position: "end" | "next"): QueueTransition {
    const additions = items.map(cloneItem);
    if (additions.length === 0) return this.transition(NO_EFFECT);

    const currentIndex = this.currentIndex();
    const insertionIndex =
      position === "next" && currentIndex >= 0 ? currentIndex + 1 : this.items.length;
    this.items.splice(insertionIndex, 0, ...additions);
    this.rebuildShuffleOrder();
    return this.transition(NO_EFFECT);
  }

  getSnapshot(): PlaybackQueueSnapshot {
    return cloneSnapshot({
      currentIndex: this.currentIndex(),
      currentItemId: this.currentItemId,
      items: this.items,
      repeatMode: this.repeatMode,
      shuffleEnabled: this.shuffleEnabled,
    });
  }

  move(queueItemId: string, targetIndex: number): QueueTransition {
    const fromIndex = this.items.findIndex((item) => item.queueItemId === queueItemId);
    if (fromIndex < 0 || this.items.length < 2) return this.transition(NO_EFFECT);

    const [item] = this.items.splice(fromIndex, 1);
    this.items.splice(clampIndex(targetIndex, this.items.length + 1), 0, item!);
    this.rebuildShuffleOrder();
    this.resetHistoryToCurrent();
    return this.transition(NO_EFFECT);
  }

  next(reason: Extract<QueueAdvanceReason, "ended" | "failure" | "manual">): QueueTransition {
    const current = this.currentItem();
    if (!current) return this.transition(NO_EFFECT);

    if (reason === "ended" && this.repeatMode === "one") {
      return this.transition(this.playEffect(current, "ended"));
    }

    const forwardHistory = this.historyItemIds[this.historyCursor + 1];
    if (forwardHistory) return this.selectKnownItem(forwardHistory, reason, false);

    const order = this.selectionOrder();
    const currentOrderIndex = order.indexOf(current.queueItemId);
    const nextItemId = currentOrderIndex >= 0 ? order[currentOrderIndex + 1] : undefined;
    if (nextItemId) return this.selectKnownItem(nextItemId, reason, true);

    // Repeat-one is an ended-event policy, not a source-failure recovery
    // policy. Retrying a broken tail forever would trap a user in the queue.
    const mustStop = reason !== "manual" && this.repeatMode !== "all";
    if (mustStop) return this.transition({ reason, type: "stop" });

    if (this.shuffleEnabled) this.rebuildShuffleOrder(false);
    const firstItemId = this.selectionOrder()[0];
    return firstItemId
      ? this.selectKnownItem(firstItemId, reason, true)
      : this.transition(NO_EFFECT);
  }

  previous(): QueueTransition {
    const current = this.currentItem();
    if (!current) return this.transition(NO_EFFECT);

    const previousHistory = this.historyItemIds[this.historyCursor - 1];
    if (previousHistory) return this.selectKnownItem(previousHistory, "previous", false, -1);

    const order = this.selectionOrder();
    const currentOrderIndex = order.indexOf(current.queueItemId);
    const previousIndex = currentOrderIndex <= 0 ? order.length - 1 : currentOrderIndex - 1;
    const previousItemId = order[previousIndex];
    if (!previousItemId) return this.transition(NO_EFFECT);

    this.historyItemIds = [previousItemId];
    this.historyCursor = 0;
    return this.selectKnownItem(previousItemId, "previous", false);
  }

  remove(queueItemId: string): QueueTransition {
    const removedIndex = this.items.findIndex((item) => item.queueItemId === queueItemId);
    if (removedIndex < 0) return this.transition(NO_EFFECT);

    const removedCurrent = queueItemId === this.currentItemId;
    this.items.splice(removedIndex, 1);
    this.historyItemIds = this.historyItemIds.filter((id) => id !== queueItemId);

    if (this.items.length === 0) {
      this.currentItemId = null;
      this.historyCursor = -1;
      this.shuffleOrder = [];
      return this.transition({ reason: "queue-empty", type: "stop" });
    }

    if (!removedCurrent) {
      this.rebuildShuffleOrder();
      this.clampHistoryCursor();
      return this.transition(NO_EFFECT);
    }

    const successor = this.items[Math.min(removedIndex, this.items.length - 1)]!;
    this.currentItemId = successor.queueItemId;
    this.rebuildShuffleOrder();
    this.resetHistoryToCurrent();
    return this.transition(this.playEffect(successor, "queue-item-removed"));
  }

  replace(items: readonly PlaybackQueueItem[], startIndex = 0): QueueTransition {
    this.items = items.map(cloneItem);
    this.shuffleOrder = [];
    this.historyItemIds = [];
    this.historyCursor = -1;

    if (this.items.length === 0) {
      this.currentItemId = null;
      return this.transition({ reason: "queue-empty", type: "stop" });
    }

    const selected = this.items[clampIndex(startIndex, this.items.length)]!;
    this.currentItemId = selected.queueItemId;
    this.rebuildShuffleOrder();
    this.resetHistoryToCurrent();
    return this.transition(this.playEffect(selected, "queue-replaced"));
  }

  select(queueItemId: string): QueueTransition {
    const selected = this.items.find((item) => item.queueItemId === queueItemId);
    if (!selected) return this.transition(NO_EFFECT);

    this.currentItemId = selected.queueItemId;
    this.recordHistory(selected.queueItemId);
    return this.transition(this.playEffect(selected, "selection"));
  }

  setRepeatMode(mode: PlaybackRepeatMode): QueueTransition {
    this.repeatMode = mode;
    return this.transition(NO_EFFECT);
  }

  setShuffleEnabled(enabled: boolean): QueueTransition {
    if (this.shuffleEnabled === enabled) return this.transition(NO_EFFECT);
    this.shuffleEnabled = enabled;
    this.rebuildShuffleOrder();
    this.resetHistoryToCurrent();
    return this.transition(NO_EFFECT);
  }

  private clampHistoryCursor(): void {
    this.historyCursor = Math.min(this.historyCursor, this.historyItemIds.length - 1);
  }

  private currentIndex(): number {
    if (!this.currentItemId) return -1;
    return this.items.findIndex((item) => item.queueItemId === this.currentItemId);
  }

  private currentItem(): PlaybackQueueItem | null {
    const index = this.currentIndex();
    return index >= 0 ? this.items[index]! : null;
  }

  private playEffect(
    item: PlaybackQueueItem,
    reason: QueueAdvanceReason | "queue-item-removed" | "queue-replaced",
  ): QueueEffect {
    return { item: cloneItem(item), reason, type: "play" };
  }

  private recordHistory(queueItemId: string): void {
    if (this.historyItemIds[this.historyCursor] === queueItemId) return;
    this.historyItemIds = [...this.historyItemIds.slice(0, this.historyCursor + 1), queueItemId];
    this.historyCursor = this.historyItemIds.length - 1;
  }

  /**
   * Normal shuffle changes preserve the loaded item at the start so the next
   * action follows it. A completed cycle deliberately does not: otherwise the
   * tail would be selected again before any newly shuffled item.
   */
  private rebuildShuffleOrder(keepCurrentFirst = true): void {
    if (!this.shuffleEnabled) {
      this.shuffleOrder = this.items.map((item) => item.queueItemId);
      return;
    }

    const currentId = this.currentItemId;
    const remaining = this.items
      .map((item) => item.queueItemId)
      .filter((queueItemId) => queueItemId !== currentId);
    const hasCurrent = currentId && this.items.some((item) => item.queueItemId === currentId);
    if (!hasCurrent) {
      this.shuffleOrder = this.shuffleIds(this.items.map((item) => item.queueItemId));
    } else if (keepCurrentFirst) {
      this.shuffleOrder = [currentId, ...this.shuffleIds(remaining)];
    } else {
      // A fresh cycle leaves the old tail until last, preventing an audible
      // one-track loop when random happens to put that tail first again.
      this.shuffleOrder = [...this.shuffleIds(remaining), currentId];
    }
  }

  private shuffleIds(ids: string[]): string[] {
    const shuffled = [...ids];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
    }
    return shuffled;
  }

  private resetHistoryToCurrent(): void {
    if (!this.currentItemId) {
      this.historyItemIds = [];
      this.historyCursor = -1;
      return;
    }
    this.historyItemIds = [this.currentItemId];
    this.historyCursor = 0;
  }

  private selectKnownItem(
    queueItemId: string,
    reason: QueueAdvanceReason,
    recordHistory: boolean,
    historyOffset = 0,
  ): QueueTransition {
    const item = this.items.find((candidate) => candidate.queueItemId === queueItemId);
    if (!item) return this.transition(NO_EFFECT);

    this.currentItemId = item.queueItemId;
    if (recordHistory) this.recordHistory(item.queueItemId);
    else this.historyCursor += historyOffset;
    return this.transition(this.playEffect(item, reason));
  }

  private selectionOrder(): string[] {
    if (this.shuffleOrder.length !== this.items.length) this.rebuildShuffleOrder();
    return this.shuffleOrder;
  }

  private transition(effect: QueueEffect): QueueTransition {
    return {
      effect,
      snapshot: this.getSnapshot(),
    };
  }
}

export function createPlaybackQueue(options: CreatePlaybackQueueOptions = {}): PlaybackQueue {
  return new DefaultPlaybackQueue(options.random ?? Math.random);
}

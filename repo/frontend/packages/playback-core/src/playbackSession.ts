import { createPlaybackQueue } from "./playbackQueue";
import type {
  AudioEngineEvent,
  PlaybackFailure,
  PlaybackGateway,
  PlaybackOperationResult,
  PlaybackQueueItem,
  PlaybackQueueSelectionOptions,
  PlaybackSession,
  PlaybackSessionDependencies,
  PlaybackSnapshot,
  PlayableSource,
  QueueTransition,
  SourceResolution,
} from "./types";

const PLAYBACK_VOLUME_MAX = 100;

function cloneSnapshot(snapshot: PlaybackSnapshot): PlaybackSnapshot {
  return {
    ...snapshot,
    error: snapshot.error ? { ...snapshot.error } : null,
    queue: {
      ...snapshot.queue,
      items: snapshot.queue.items.map((item) => ({
        locator: { ...item.locator },
        queueItemId: item.queueItemId,
        track: { ...item.track, artistNames: [...item.track.artistNames] },
      })),
    },
    track: snapshot.track
      ? { ...snapshot.track, artistNames: [...snapshot.track.artistNames] }
      : null,
  };
}

function accepted(): PlaybackOperationResult {
  return { status: "accepted" };
}

function unavailable(reason: string): PlaybackOperationResult {
  return { reason, status: "unavailable" };
}

function rejected(reason: string): PlaybackOperationResult {
  return { reason, status: "rejected" };
}

function currentItem(snapshot: PlaybackSnapshot): PlaybackQueueItem | null {
  if (!snapshot.queue.currentItemId) return null;
  return (
    snapshot.queue.items.find((item) => item.queueItemId === snapshot.queue.currentItemId) ?? null
  );
}

/**
 * Deep implementation behind PlaybackGateway. It owns the only playback state
 * machine, while Queue/Resolver/Engine remain narrow collaborators. There is no
 * runtime detection here: Web and Desktop select their adapters at composition.
 */
class DefaultPlaybackSession implements PlaybackSession {
  private activeItemId: string | null = null;
  private activeSource: PlayableSource | null = null;
  private completedRevision: number | null = null;
  private disposed = false;
  private loadAbortController: AbortController | null = null;
  private loadRevision = 0;
  private readonly listeners = new Set<(snapshot: PlaybackSnapshot) => void>();
  private recoveredRevision: number | null = null;
  private readonly queue = createPlaybackQueue();
  private snapshot: PlaybackSnapshot;
  private readonly unsubscribeEngine: () => void;

  constructor(private readonly dependencies: PlaybackSessionDependencies) {
    const engineSnapshot = dependencies.audioEngine.getSnapshot();
    this.snapshot = {
      durationMs: Math.max(0, engineSnapshot.durationMs),
      error: null,
      phase: "idle",
      playbackRate: Math.max(0, engineSnapshot.playbackRate),
      positionMs: Math.max(0, engineSnapshot.positionMs),
      queue: this.queue.getSnapshot(),
      track: null,
      volume: Math.max(0, Math.min(PLAYBACK_VOLUME_MAX, engineSnapshot.volume)),
    };
    this.unsubscribeEngine = dependencies.audioEngine.subscribe((event) => {
      void this.handleEngineEvent(event);
    });
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.loadAbortController?.abort();
    this.unsubscribeEngine();
    this.listeners.clear();
    await this.dependencies.audioEngine.dispose();
  }

  async enqueue(
    items: readonly PlaybackQueueItem[],
    position: "end" | "next",
  ): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    this.applyQueueSnapshot(this.queue.enqueue(items, position));
    return accepted();
  }

  getSnapshot(): PlaybackSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  async moveQueueItem(queueItemId: string, targetIndex: number): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    this.applyQueueSnapshot(this.queue.move(queueItemId, targetIndex));
    return accepted();
  }

  async next(): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    return this.applyQueueTransition(this.queue.next("manual"), { autoPlay: true });
  }

  async pause(): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    if (!currentItem(this.snapshot)) return unavailable("no-queue-item");
    try {
      await this.dependencies.audioEngine.pause();
      this.update({ phase: "paused" });
      return accepted();
    } catch {
      return rejected("audio-engine-pause-failed");
    }
  }

  async play(): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    const item = currentItem(this.snapshot);
    if (!item) return unavailable("no-queue-item");

    if (
      this.activeItemId !== item.queueItemId ||
      this.snapshot.phase === "ended" ||
      this.snapshot.phase === "error"
    ) {
      return this.loadItem(item, { autoPlay: true });
    }
    if (
      this.snapshot.phase === "playing" ||
      this.snapshot.phase === "resolving" ||
      this.snapshot.phase === "loading"
    ) {
      return accepted();
    }

    try {
      await this.dependencies.audioEngine.play();
      this.update({ phase: "playing" });
      return accepted();
    } catch {
      return rejected("audio-engine-play-failed");
    }
  }

  async playQueueItem(
    queueItemId: string,
    options: PlaybackQueueSelectionOptions = {},
  ): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    return this.applyQueueTransition(this.queue.select(queueItemId), options);
  }

  async previous(): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    return this.applyQueueTransition(this.queue.previous(), { autoPlay: true });
  }

  async removeQueueItem(queueItemId: string): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    return this.applyQueueTransition(this.queue.remove(queueItemId), { autoPlay: true });
  }

  async replaceQueue(
    items: readonly PlaybackQueueItem[],
    options: PlaybackQueueSelectionOptions & { startIndex?: number } = {},
  ): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    return this.applyQueueTransition(this.queue.replace(items, options.startIndex), options);
  }

  async seek(positionMs: number): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    if (!Number.isFinite(positionMs) || positionMs < 0) return rejected("invalid-seek-position");
    if (!currentItem(this.snapshot)) return unavailable("no-queue-item");

    const boundedPosition =
      this.snapshot.durationMs > 0 ? Math.min(positionMs, this.snapshot.durationMs) : positionMs;
    try {
      await this.dependencies.audioEngine.seek(boundedPosition);
      this.update({ positionMs: boundedPosition });
      return accepted();
    } catch {
      return rejected("audio-engine-seek-failed");
    }
  }

  setRepeatMode(mode: Parameters<PlaybackSession["setRepeatMode"]>[0]): PlaybackOperationResult {
    if (this.disposed) return unavailable("playback-session-disposed");
    this.applyQueueSnapshot(this.queue.setRepeatMode(mode));
    return accepted();
  }

  setShuffleEnabled(enabled: boolean): PlaybackOperationResult {
    if (this.disposed) return unavailable("playback-session-disposed");
    this.applyQueueSnapshot(this.queue.setShuffleEnabled(enabled));
    return accepted();
  }

  async setVolume(volume: number): Promise<PlaybackOperationResult> {
    if (this.disposed) return unavailable("playback-session-disposed");
    if (!Number.isFinite(volume) || volume < 0 || volume > PLAYBACK_VOLUME_MAX) {
      return rejected("invalid-volume");
    }
    try {
      await this.dependencies.audioEngine.setVolume(volume);
      this.update({ volume });
      return accepted();
    } catch {
      return rejected("audio-engine-volume-failed");
    }
  }

  subscribe(listener: (snapshot: PlaybackSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async toggle(): Promise<PlaybackOperationResult> {
    return this.snapshot.phase === "playing" ? this.pause() : this.play();
  }

  private applyQueueSnapshot(transition: QueueTransition): void {
    this.update({ queue: transition.snapshot });
  }

  private async applyQueueTransition(
    transition: QueueTransition,
    options: PlaybackQueueSelectionOptions,
  ): Promise<PlaybackOperationResult> {
    this.applyQueueSnapshot(transition);
    const { effect } = transition;
    if (effect.type === "none") return unavailable("queue-selection-unavailable");
    if (effect.type === "stop") {
      this.loadAbortController?.abort();
      // The engine can still emit events for the stopped source. Advancing the
      // revision makes those events harmless instead of resurrecting a cleared
      // queue or overwriting the following load's state.
      this.loadRevision += 1;
      this.activeItemId = null;
      this.activeSource = null;
      try {
        await this.dependencies.audioEngine.stop();
      } catch {
        return rejected("audio-engine-stop-failed");
      }
      this.update({
        error: null,
        phase: effect.reason === "queue-empty" ? "idle" : "ended",
        positionMs: 0,
        track: effect.reason === "queue-empty" ? null : this.snapshot.track,
      });
      return accepted();
    }
    return this.loadItem(effect.item, options);
  }

  private async handleEngineEvent(event: AudioEngineEvent): Promise<void> {
    if (this.disposed || event.revision !== this.loadRevision) return;

    switch (event.type) {
      case "loaded":
        this.update({ durationMs: event.durationMs });
        return;
      case "playing":
        this.update({ phase: "playing" });
        return;
      case "paused":
        this.update({ phase: "paused" });
        return;
      case "buffering":
        this.update({ phase: "buffering" });
        return;
      case "position":
        this.update({ positionMs: event.positionMs });
        return;
      case "volume":
        this.update({ volume: event.volume });
        return;
      case "stopped":
        if (this.snapshot.phase !== "ended") this.update({ phase: "idle" });
        return;
      case "ended":
        await this.handleEnded(event.revision);
        return;
      case "source-error":
        await this.recoverFromSourceError(event.revision, event.reason);
        return;
      case "output-error":
        this.updateFailure({ kind: "output", reason: event.reason, retryable: true });
    }
  }

  private async handleEnded(revision: number): Promise<void> {
    if (this.completedRevision === revision) return;
    this.completedRevision = revision;
    this.update({ phase: "ended" });
    await this.applyQueueTransition(this.queue.next("ended"), { autoPlay: true });
  }

  private async loadItem(
    item: PlaybackQueueItem,
    options: PlaybackQueueSelectionOptions,
    excludedCandidateIds: readonly string[] = [],
    preservePositionMs = 0,
  ): Promise<PlaybackOperationResult> {
    const revision = ++this.loadRevision;
    this.loadAbortController?.abort();
    const controller = new AbortController();
    this.loadAbortController = controller;
    this.activeItemId = item.queueItemId;
    this.activeSource = null;
    this.completedRevision = null;
    this.recoveredRevision = null;
    this.update({
      durationMs: item.track.durationMs ?? 0,
      error: null,
      phase: "resolving",
      positionMs: preservePositionMs,
      track: item.track,
    });

    const rejectedCandidates = [...excludedCandidateIds];
    const retryLimit = Math.max(0, this.dependencies.sourceRetryLimit ?? 1);
    for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
      let resolution: SourceResolution;
      try {
        resolution = await this.dependencies.sourceResolver.resolve(item, {
          excludedCandidateIds: rejectedCandidates,
          quality: this.dependencies.quality ?? "high",
          reason:
            attempt === 0
              ? rejectedCandidates.length === 0
                ? "initial"
                : "source-expired"
              : "retry",
          sessionRevision: this.dependencies.sourceSessionRevision?.() ?? 0,
          signal: controller.signal,
        });
      } catch {
        this.updateFailure({ kind: "source", reason: "source-resolver-failed", retryable: true });
        return unavailable("audio-source-unavailable");
      }
      if (!this.isCurrentLoad(revision, controller)) return unavailable("load-superseded");

      if (resolution.status !== "resolved") {
        if (resolution.status === "unavailable" && resolution.retryable && attempt < retryLimit)
          continue;
        return this.handleResolutionFailure(resolution);
      }

      this.activeSource = resolution.source;
      this.update({ phase: "loading" });
      let loadResult;
      try {
        loadResult = await this.dependencies.audioEngine.load(resolution.source, {
          revision,
          signal: controller.signal,
        });
      } catch {
        this.dependencies.sourceResolver.invalidate(item.locator);
        this.updateFailure({ kind: "engine", reason: "audio-engine-load-failed", retryable: true });
        return rejected("audio-engine-load-failed");
      }
      if (!this.isCurrentLoad(revision, controller)) return unavailable("load-superseded");

      if (loadResult.status === "failed") {
        this.dependencies.sourceResolver.invalidate(item.locator);
        rejectedCandidates.push(resolution.source.candidateId);
        if (loadResult.retryable && attempt < retryLimit) continue;
        this.updateFailure({
          kind: "engine",
          reason: loadResult.reason,
          retryable: loadResult.retryable,
        });
        return unavailable("audio-source-load-failed");
      }

      this.update({ durationMs: loadResult.durationMs, phase: "paused" });
      if (preservePositionMs > 0) {
        await this.dependencies.audioEngine.seek(
          Math.min(preservePositionMs, loadResult.durationMs),
        );
        if (!this.isCurrentLoad(revision, controller)) return unavailable("load-superseded");
      }
      if (options.autoPlay ?? true) {
        try {
          await this.dependencies.audioEngine.play();
          if (!this.isCurrentLoad(revision, controller)) return unavailable("load-superseded");
          this.update({ phase: "playing" });
        } catch {
          this.updateFailure({
            kind: "engine",
            reason: "audio-engine-play-failed",
            retryable: true,
          });
          return rejected("audio-engine-play-failed");
        }
      }
      return accepted();
    }

    return unavailable("audio-source-unavailable");
  }

  private handleResolutionFailure(
    resolution: Exclude<SourceResolution, { status: "resolved" }>,
  ): PlaybackOperationResult {
    this.updateFailure({
      kind: "source",
      reason: resolution.reason,
      retryable: resolution.status === "unavailable" && resolution.retryable,
    });
    return unavailable("audio-source-unavailable");
  }

  private isCurrentLoad(revision: number, controller: AbortController): boolean {
    return !this.disposed && !controller.signal.aborted && revision === this.loadRevision;
  }

  private async recoverFromSourceError(revision: number, reason: string): Promise<void> {
    if (this.recoveredRevision === revision || this.completedRevision === revision) return;
    const item = currentItem(this.snapshot);
    const source = this.activeSource;
    if (!item || !source) {
      this.updateFailure({ kind: "source", reason, retryable: true });
      return;
    }

    this.recoveredRevision = revision;
    this.dependencies.sourceResolver.invalidate(item.locator);
    await this.loadItem(
      item,
      { autoPlay: this.snapshot.phase === "playing" || this.snapshot.phase === "buffering" },
      [source.candidateId],
      this.snapshot.positionMs,
    );
  }

  private update(patch: Partial<PlaybackSnapshot>): void {
    this.snapshot = {
      ...this.snapshot,
      ...patch,
      queue: patch.queue ?? this.queue.getSnapshot(),
    };
    for (const listener of this.listeners) {
      try {
        // A listener must not be able to mutate the projection observed by its
        // siblings, even within this one notification turn.
        listener(this.getSnapshot());
      } catch {
        // Subscribers are projections; a broken projection must not break playback.
      }
    }
  }

  private updateFailure(failure: PlaybackFailure): void {
    this.update({ error: failure, phase: "error" });
  }
}

export function createPlaybackSession(
  dependencies: PlaybackSessionDependencies,
): PlaybackSession & PlaybackGateway {
  return new DefaultPlaybackSession(dependencies);
}

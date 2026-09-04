/**
 * Public types for Scopify's runtime-neutral playback core.
 *
 * A queue keeps durable identity and presentation data. A resolver may turn that
 * identity into a short-lived URL or a local path, but those sensitive values
 * never appear in a queue item or a public playback snapshot.
 */

export type PlaybackQuality =
  "standard" | "high" | "lossless" | "hires" | "dolby" | "spatial" | "sky" | "master";

export type TrackLocator =
  | {
      kind: "netease";
      songId: string;
    }
  | {
      fileId: string;
      kind: "local";
    }
  | {
      kind: "streaming";
      serverId: string;
      trackId: string;
    };

/** Presentation metadata only. This is safe to expose to UI and MCP callers. */
export interface PlaybackTrack {
  albumTitle?: string;
  artistNames: string[];
  artworkUrl?: string;
  durationMs?: number;
  id: string;
  title: string;
}

/**
 * `queueItemId` identifies one placement in a queue and must be unique inside
 * that queue. It intentionally differs from `track.id`: the same song may be
 * queued more than once.
 */
export interface PlaybackQueueItem {
  locator: TrackLocator;
  queueItemId: string;
  track: PlaybackTrack;
}

export type PlaybackRepeatMode = "off" | "all" | "one";

export type QueueAdvanceReason = "ended" | "failure" | "manual" | "previous" | "selection";

export interface PlaybackQueueSnapshot {
  currentIndex: number;
  currentItemId: string | null;
  items: PlaybackQueueItem[];
  repeatMode: PlaybackRepeatMode;
  shuffleEnabled: boolean;
}

/** Queue effects describe the next business action without performing it. */
export type QueueEffect =
  | {
      item: PlaybackQueueItem;
      reason: QueueAdvanceReason | "queue-item-removed" | "queue-replaced";
      type: "play";
    }
  | {
      reason: "ended" | "failure" | "queue-empty";
      type: "stop";
    }
  | { type: "none" };

export interface QueueTransition {
  effect: QueueEffect;
  snapshot: PlaybackQueueSnapshot;
}

export interface PlaybackQueue {
  enqueue(items: readonly PlaybackQueueItem[], position: "end" | "next"): QueueTransition;
  getSnapshot(): PlaybackQueueSnapshot;
  move(queueItemId: string, targetIndex: number): QueueTransition;
  next(reason: Extract<QueueAdvanceReason, "ended" | "failure" | "manual">): QueueTransition;
  previous(): QueueTransition;
  remove(queueItemId: string): QueueTransition;
  replace(items: readonly PlaybackQueueItem[], startIndex?: number): QueueTransition;
  select(queueItemId: string): QueueTransition;
  setRepeatMode(mode: PlaybackRepeatMode): QueueTransition;
  setShuffleEnabled(enabled: boolean): QueueTransition;
}

/** A source is ephemeral and may contain signed URLs or local absolute paths. */
export type PlayableSource =
  | {
      candidateId: string;
      expiresAtMs?: number;
      kind: "remote";
      quality: PlaybackQuality;
      url: string;
    }
  | {
      candidateId: string;
      kind: "local";
      path: string;
      quality?: PlaybackQuality;
    };

export type SourceResolveReason = "initial" | "quality-change" | "retry" | "source-expired";

export interface SourceResolveRequest {
  excludedCandidateIds: readonly string[];
  quality: PlaybackQuality;
  reason: SourceResolveReason;
  /** Changes when credentials change, preventing cross-account URL reuse. */
  sessionRevision: number;
  signal: AbortSignal;
}

export type SourceResolution =
  | { source: PlayableSource; status: "resolved" }
  | { reason: string; status: "unsupported" }
  | { reason: string; retryable: boolean; status: "unavailable" };

/**
 * Adapters vary by runtime and locator kind. For example, Web provides a
 * NetEase HTTP adapter while Desktop can additionally provide a local library
 * adapter. They must observe the supplied AbortSignal.
 */
export interface PlayableSourceAdapter {
  resolve(locator: TrackLocator, request: SourceResolveRequest): Promise<SourceResolution>;
}

export type PlayableSourceAdapterRegistry = Partial<
  Record<TrackLocator["kind"], PlayableSourceAdapter>
>;

export interface PlayableSourceCache {
  clear(): void;
  get(
    locator: TrackLocator,
    quality: PlaybackQuality,
    sessionRevision: number,
  ): PlayableSource | null;
  invalidate(locator: TrackLocator): void;
  set(
    locator: TrackLocator,
    quality: PlaybackQuality,
    sessionRevision: number,
    source: PlayableSource,
  ): void;
}

export interface PlayableSourceResolver {
  invalidate(locator: TrackLocator): void;
  resolve(item: PlaybackQueueItem, request: SourceResolveRequest): Promise<SourceResolution>;
}

export type AudioEnginePhase = "buffering" | "ended" | "idle" | "paused" | "playing" | "stopped";

export interface AudioEngineSnapshot {
  durationMs: number;
  phase: AudioEnginePhase;
  playbackRate: number;
  positionMs: number;
  volume: number;
}

export interface AudioEngineLoadOptions {
  revision: number;
  signal: AbortSignal;
}

export type AudioEngineLoadResult =
  | { durationMs: number; status: "loaded" }
  | { reason: string; retryable: boolean; status: "failed" };

/** Every engine event belongs to the load revision that produced it. */
export type AudioEngineEvent =
  | { durationMs: number; revision: number; type: "loaded" }
  | { revision: number; type: "playing" }
  | { revision: number; type: "paused" }
  | { revision: number; type: "buffering" }
  | { positionMs: number; revision: number; sampledAtMs: number; type: "position" }
  | { revision: number; type: "ended" }
  | { reason: string; revision: number; type: "source-error" }
  | { reason: string; revision: number; type: "output-error" }
  | { revision: number; type: "stopped" }
  | { revision: number; type: "volume"; volume: number };

/**
 * The physical playback seam. It knows URL/path loading and audio output, but
 * never knows queue ordering, providers, credentials, or MCP.
 */
export interface AudioEngineAdapter {
  dispose(): Promise<void>;
  getSnapshot(): AudioEngineSnapshot;
  load(source: PlayableSource, options: AudioEngineLoadOptions): Promise<AudioEngineLoadResult>;
  pause(): Promise<void>;
  play(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (event: AudioEngineEvent) => void): () => void;
}

export type PlaybackPhase =
  "buffering" | "ended" | "error" | "idle" | "loading" | "paused" | "playing" | "resolving";

export interface PlaybackFailure {
  kind: "engine" | "output" | "source";
  reason: string;
  retryable: boolean;
}

/** Safe public projection: it excludes a source URL, a file path, and credentials. */
export interface PlaybackSnapshot {
  durationMs: number;
  error: PlaybackFailure | null;
  phase: PlaybackPhase;
  playbackRate: number;
  positionMs: number;
  queue: PlaybackQueueSnapshot;
  track: PlaybackTrack | null;
  volume: number;
}

export type PlaybackOperationResult =
  | { status: "accepted" }
  | { reason: string; status: "rejected" }
  | { reason: string; status: "unavailable" };

/** The stable, small control interface consumed by UI, tray, shortcuts, and MCP. */
export interface PlaybackGateway {
  getSnapshot(): PlaybackSnapshot;
  next(): Promise<PlaybackOperationResult>;
  pause(): Promise<PlaybackOperationResult>;
  play(): Promise<PlaybackOperationResult>;
  previous(): Promise<PlaybackOperationResult>;
  seek(positionMs: number): Promise<PlaybackOperationResult>;
  setVolume(volume: number): Promise<PlaybackOperationResult>;
  subscribe(listener: (snapshot: PlaybackSnapshot) => void): () => void;
  toggle(): Promise<PlaybackOperationResult>;
}

/**
 * The session extends the control interface only for its owning UI/runtime. MCP
 * receives the narrower PlaybackGateway interface and cannot mutate a queue.
 */
export interface PlaybackSession extends PlaybackGateway {
  dispose(): Promise<void>;
  enqueue(
    items: readonly PlaybackQueueItem[],
    position: "end" | "next",
  ): Promise<PlaybackOperationResult>;
  moveQueueItem(queueItemId: string, targetIndex: number): Promise<PlaybackOperationResult>;
  playQueueItem(
    queueItemId: string,
    options?: PlaybackQueueSelectionOptions,
  ): Promise<PlaybackOperationResult>;
  removeQueueItem(queueItemId: string): Promise<PlaybackOperationResult>;
  replaceQueue(
    items: readonly PlaybackQueueItem[],
    options?: PlaybackQueueSelectionOptions & { startIndex?: number },
  ): Promise<PlaybackOperationResult>;
  setRepeatMode(mode: PlaybackRepeatMode): PlaybackOperationResult;
  setShuffleEnabled(enabled: boolean): PlaybackOperationResult;
}

export interface PlaybackQueueSelectionOptions {
  autoPlay?: boolean;
}

export interface PlaybackSessionDependencies {
  audioEngine: AudioEngineAdapter;
  quality?: PlaybackQuality;
  sourceResolver: PlayableSourceResolver;
  /** Defaults to 0. Provide a credential version to isolate signed URL caches. */
  sourceSessionRevision?: () => number;
  /** Number of retryable source/load failures after the initial attempt. Defaults to 1. */
  sourceRetryLimit?: number;
}

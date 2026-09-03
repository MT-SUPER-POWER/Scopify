import type {
  AudioEngineAdapter,
  AudioEngineEvent,
  AudioEngineLoadOptions,
  AudioEngineLoadResult,
  AudioEngineSnapshot,
  PlayableSource,
} from "@scopify/playback-core";

import { PLAYBACK_VOLUME_MAX } from "@scopify/desktop-contract";

import { isPlaybackSourceCurrent, waitForPlaybackSource } from "@/lib/player/playbackSource";
import type {
  PlaybackAuthorityMediaEvent,
  PlaybackMediaPort,
  PlaybackMediaSample,
} from "@/types/playbackAuthority";

const MEDIA_EVENTS: ReadonlyArray<
  readonly [keyof HTMLMediaElementEventMap, HtmlAudioMediaEventType]
> = [
  ["loadstart", "load-start"],
  ["playing", "playing"],
  ["pause", "pause"],
  ["waiting", "waiting"],
  ["stalled", "waiting"],
  ["canplay", "can-play"],
  ["ended", "ended"],
  ["error", "error"],
  ["durationchange", "duration-change"],
  ["loadedmetadata", "duration-change"],
  ["ratechange", "rate-change"],
  ["progress", "progress"],
  ["timeupdate", "time-update"],
];

export type HtmlAudioMediaEventType = PlaybackAuthorityMediaEvent | "progress" | "time-update";

export interface HtmlAudioMediaEvent {
  bufferedPositionMs: number;
  errorCode: number | null;
  errorMessage: string | null;
  networkState: number;
  readyState: number;
  revision: number;
  sample: PlaybackMediaSample;
  type: HtmlAudioMediaEventType;
}

/**
 * The only Browser adapter that may touch an HTMLAudioElement.
 *
 * `setRemoteSource`/`clearSource` are temporary compatibility entry points for
 * the Zustand-owned player. Once PlaybackSession owns the queue, it will use
 * the standard `load(PlayableSource, options)` method exclusively.
 */
export interface HtmlAudioEngineAdapter extends AudioEngineAdapter {
  clearSource(revision?: number): void;
  getMediaSample(): PlaybackMediaSample;
  getSourceHost(): string | null;
  hasSource(): boolean;
  isCurrentSource(sourceUrl: string): boolean;
  isSourceLoading(): boolean;
  setRemoteSource(sourceUrl: string, revision: number): void;
  subscribeMedia(listener: (event: HtmlAudioMediaEvent) => void): () => void;
  waitForSource(sourceUrl: string, isCurrent: () => boolean): Promise<boolean>;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function clampVolume(volume: number): number {
  return Math.max(0, Math.min(PLAYBACK_VOLUME_MAX, volume));
}

function bufferedPositionMs(audio: HTMLAudioElement): number {
  if (audio.buffered.length === 0) return 0;
  return finiteNonNegative(audio.buffered.end(audio.buffered.length - 1) * 1_000);
}

class DefaultHtmlAudioEngineAdapter implements HtmlAudioEngineAdapter {
  private disposed = false;
  private lastLoadedRevision: number | null = null;
  private readonly listeners = new Set<(event: AudioEngineEvent) => void>();
  private readonly mediaListeners = new Set<(event: HtmlAudioMediaEvent) => void>();
  private revision = 0;
  private sourceLoading = false;
  private readonly subscriptions: Array<readonly [keyof HTMLMediaElementEventMap, EventListener]>;

  constructor(private readonly audio: HTMLAudioElement) {
    this.subscriptions = MEDIA_EVENTS.map(([domEvent, mediaEvent]) => {
      const listener: EventListener = () => this.handleMediaEvent(mediaEvent);
      audio.addEventListener(domEvent, listener);
      return [domEvent, listener] as const;
    });
  }

  clearSource(revision = this.revision + 1): void {
    if (this.disposed) return;
    this.revision = revision;
    this.lastLoadedRevision = null;
    this.sourceLoading = false;
    this.audio.removeAttribute("src");
    this.audio.load();
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    for (const [event, listener] of this.subscriptions) {
      this.audio.removeEventListener(event, listener);
    }
    this.listeners.clear();
    this.mediaListeners.clear();
  }

  getMediaSample(): PlaybackMediaSample {
    return {
      durationMs: finiteNonNegative(this.audio.duration * 1_000),
      ended: this.audio.ended,
      errorMessage: this.audio.error?.message ?? null,
      paused: this.audio.paused,
      playbackRate: finiteNonNegative(this.audio.playbackRate),
      positionMs: finiteNonNegative(this.audio.currentTime * 1_000),
      volume: clampVolume(this.audio.volume * PLAYBACK_VOLUME_MAX),
    };
  }

  getSnapshot(): AudioEngineSnapshot {
    const sample = this.getMediaSample();
    return {
      durationMs: sample.durationMs,
      phase: sample.ended
        ? "ended"
        : this.sourceLoading
          ? "buffering"
          : sample.paused
            ? "paused"
            : "playing",
      playbackRate: sample.playbackRate,
      positionMs: sample.positionMs,
      volume: sample.volume,
    };
  }

  getSourceHost(): string | null {
    try {
      return new URL(this.audio.currentSrc || this.audio.src).host || null;
    } catch {
      return null;
    }
  }

  hasSource(): boolean {
    return Boolean(this.audio.currentSrc || this.audio.getAttribute("src"));
  }

  isCurrentSource(sourceUrl: string): boolean {
    return isPlaybackSourceCurrent(this.audio, sourceUrl);
  }

  isSourceLoading(): boolean {
    return this.sourceLoading;
  }

  async load(
    source: PlayableSource,
    options: AudioEngineLoadOptions,
  ): Promise<AudioEngineLoadResult> {
    if (this.disposed)
      return { reason: "html-audio-engine-disposed", retryable: false, status: "failed" };
    if (source.kind !== "remote") {
      return { reason: "html-audio-local-source-unsupported", retryable: false, status: "failed" };
    }
    if (options.signal.aborted) {
      return { reason: "html-audio-load-aborted", retryable: false, status: "failed" };
    }

    this.setRemoteSource(source.url, options.revision);
    const ready = await this.waitForSource(source.url, () => {
      return !this.disposed && !options.signal.aborted && this.revision === options.revision;
    });
    if (!ready) {
      return {
        reason: options.signal.aborted
          ? "html-audio-load-aborted"
          : "html-audio-source-unavailable",
        retryable: !options.signal.aborted,
        status: "failed",
      };
    }
    return { durationMs: this.getMediaSample().durationMs, status: "loaded" };
  }

  async pause(): Promise<void> {
    this.audio.pause();
  }

  async play(): Promise<void> {
    await this.audio.play();
  }

  async seek(positionMs: number): Promise<void> {
    this.audio.currentTime = finiteNonNegative(positionMs) / 1_000;
  }

  async setVolume(volume: number): Promise<void> {
    this.audio.volume = clampVolume(volume) / PLAYBACK_VOLUME_MAX;
  }

  setRemoteSource(sourceUrl: string, revision: number): void {
    if (this.disposed) return;
    if (this.revision === revision && this.isCurrentSource(sourceUrl)) return;
    this.revision = revision;
    this.lastLoadedRevision = null;
    this.sourceLoading = true;
    this.audio.src = sourceUrl;
    this.audio.load();
  }

  async stop(): Promise<void> {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  subscribe(listener: (event: AudioEngineEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeMedia(listener: (event: HtmlAudioMediaEvent) => void): () => void {
    this.mediaListeners.add(listener);
    return () => this.mediaListeners.delete(listener);
  }

  waitForSource(sourceUrl: string, isCurrent: () => boolean): Promise<boolean> {
    return waitForPlaybackSource(this.audio, sourceUrl, isCurrent);
  }

  private emit(event: AudioEngineEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private emitMedia(type: HtmlAudioMediaEventType): void {
    const mediaEvent: HtmlAudioMediaEvent = {
      bufferedPositionMs: bufferedPositionMs(this.audio),
      errorCode: this.audio.error?.code ?? null,
      errorMessage: this.audio.error?.message ?? null,
      networkState: this.audio.networkState,
      readyState: this.audio.readyState,
      revision: this.revision,
      sample: this.getMediaSample(),
      type,
    };
    for (const listener of this.mediaListeners) listener(mediaEvent);
  }

  private handleMediaEvent(type: HtmlAudioMediaEventType): void {
    if (this.disposed) return;
    this.emitMedia(type);

    switch (type) {
      case "load-start":
        this.sourceLoading = true;
        return;
      case "can-play":
      case "duration-change": {
        this.sourceLoading = false;
        if (this.lastLoadedRevision !== this.revision) {
          this.lastLoadedRevision = this.revision;
          this.emit({
            durationMs: this.getMediaSample().durationMs,
            revision: this.revision,
            type: "loaded",
          });
        }
        return;
      }
      case "playing":
        this.sourceLoading = false;
        this.emit({ revision: this.revision, type: "playing" });
        return;
      case "pause":
        this.emit({ revision: this.revision, type: "paused" });
        return;
      case "waiting":
        this.emit({ revision: this.revision, type: "buffering" });
        return;
      case "ended":
        this.emit({ revision: this.revision, type: "ended" });
        return;
      case "error":
        this.sourceLoading = false;
        this.emit({
          reason: this.audio.error?.message || "html-audio-source-error",
          revision: this.revision,
          type: "source-error",
        });
        return;
      case "time-update":
        this.emit({
          positionMs: this.getMediaSample().positionMs,
          revision: this.revision,
          sampledAtMs: Date.now(),
          type: "position",
        });
        return;
      case "rate-change":
      case "progress":
        return;
    }
  }
}

export function createHtmlAudioEngineAdapter(audio: HTMLAudioElement): HtmlAudioEngineAdapter {
  return new DefaultHtmlAudioEngineAdapter(audio);
}

/**
 * Authority is a transport/projection compatibility layer during phase one.
 * It consumes the adapter rather than subscribing to DOM events itself, so a
 * native adapter can eventually feed the same control path.
 */
export function createHtmlAudioPlaybackMediaPort(
  adapter: HtmlAudioEngineAdapter,
  acceptEvent?: (event: PlaybackAuthorityMediaEvent) => boolean,
): PlaybackMediaPort {
  return {
    getSample: () => adapter.getMediaSample(),
    pause: () => {
      void adapter.pause();
    },
    play: () => adapter.play(),
    seek: (positionMs) => {
      void adapter.seek(positionMs);
    },
    setVolume: (volume) => {
      void adapter.setVolume(volume);
    },
    subscribe: (listener) =>
      adapter.subscribeMedia((event) => {
        if (
          event.type === "progress" ||
          event.type === "time-update" ||
          (acceptEvent && !acceptEvent(event.type))
        ) {
          return;
        }
        listener(event.type);
      }),
  };
}

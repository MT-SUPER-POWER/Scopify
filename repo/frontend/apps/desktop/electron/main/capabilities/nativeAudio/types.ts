import type { NativeModuleUnavailableReason } from "@main/services/nativeModuleLoader";

/** A source already resolved by the playback domain. It never contains cookies. */
export type NativeAudioSource = { kind: "file"; path: string } | { kind: "https"; url: string };

/**
 * Session-owned identifier. A source resolver/session creates it; the native
 * host only echoes it so late events can never be mistaken for a new load.
 */
export interface NativeAudioLoadRequest {
  loadId: string;
  source: NativeAudioSource;
}

export type NativeAudioPhase =
  "ended" | "error" | "idle" | "loading" | "paused" | "playing" | "stopped";

export type NativeAudioFailureKind = "decode" | "output" | "source" | "unknown";

export interface NativeAudioFailure {
  kind: NativeAudioFailureKind;
  message: string;
  retryable: boolean;
}

/**
 * Safe for IPC/state projection: it deliberately excludes the source URL and
 * absolute local path. All time values use milliseconds.
 */
export interface NativeAudioSnapshot {
  durationMs: number;
  error: NativeAudioFailure | null;
  loadId: string | null;
  phase: NativeAudioPhase;
  positionMs: number;
  /** Rust's per-load token. It changes even when a Session retries one loadId. */
  token: number | null;
  volume: number;
}

export type NativeAudioEvent =
  | { snapshot: NativeAudioSnapshot; type: "ended" }
  | { snapshot: NativeAudioSnapshot; type: "loaded" }
  | { snapshot: NativeAudioSnapshot; type: "output-failed" }
  | { snapshot: NativeAudioSnapshot; type: "position" }
  | { snapshot: NativeAudioSnapshot; type: "source-error" }
  | { snapshot: NativeAudioSnapshot; type: "state-changed" };

export type NativeAudioAvailability =
  | { available: true; modulePath: string | null }
  | {
      available: false;
      diagnostic: string;
      reason:
        "disposed" | "engine-not-ready" | NativeModuleUnavailableReason | "invalid-native-module";
    };

export type NativeAudioOperationResult =
  | { snapshot: NativeAudioSnapshot; status: "accepted" }
  | { diagnostic: string; reason: string; status: "rejected" | "unavailable" };

export interface NativeAudioHost {
  dispose(): Promise<void>;
  getAvailability(): NativeAudioAvailability;
  getSnapshot(): NativeAudioSnapshot;
  load(request: NativeAudioLoadRequest): Promise<NativeAudioOperationResult>;
  pause(): Promise<NativeAudioOperationResult>;
  play(): Promise<NativeAudioOperationResult>;
  seek(positionMs: number): Promise<NativeAudioOperationResult>;
  setVolume(volume: number): Promise<NativeAudioOperationResult>;
  stop(): Promise<NativeAudioOperationResult>;
  subscribe(listener: (event: NativeAudioEvent) => void): () => void;
}

/** Runtime shape received from the generated NAPI declaration, validated before use. */
export interface NativeAudioPlayerPort {
  dispose(): void | Promise<void>;
  getSnapshot(): unknown;
  load(request: unknown): Promise<unknown>;
  onEvent(listener: (event: unknown) => void): void;
  pause(): void | Promise<void>;
  play(): void | Promise<void>;
  seek(positionMs: number): Promise<unknown>;
  setVolume(volume: number): void | Promise<void>;
  stop(): void | Promise<void>;
}

export interface NativeAudioModulePort {
  createNativeAudioPlayer(): NativeAudioPlayerPort;
  getNativeAudioEngineInfo?(): unknown;
}

import type { AudioFeatureFrameV1 } from "@scopify/desktop-contract";

/** Timer seam for the publisher transport lifecycle. */
export interface AudioFeaturePublisherTimer {
  clearTimeout(handle: unknown): void;
  setTimeout(callback: () => void, delayMs: number): unknown;
}

/** The fixed-rate Host sampler controlled by the transport lifecycle. */
export interface AudioFeaturePublisherSampler {
  disconnect(): void;
  start(): void;
  stop(): void;
}

/** Narrow publisher-only view of the high-frequency transport. */
export interface AudioFeaturePublisherTransport {
  connect(
    role: "publisher",
    connectionId: string,
    onFrame: (frame: AudioFeatureFrameV1) => void,
    onClose: () => void,
  ): () => void;
}

export interface AudioFeaturePublisherConnectionOptions {
  connectionId: string;
  reconnectDelayMs: number;
  sampler: AudioFeaturePublisherSampler;
  timer?: AudioFeaturePublisherTimer;
  transport: AudioFeaturePublisherTransport;
}

/** Explicit lifecycle keeps React as a thin mount/unmount adapter. */
export interface AudioFeaturePublisherConnection {
  dispose(): void;
  start(): void;
}

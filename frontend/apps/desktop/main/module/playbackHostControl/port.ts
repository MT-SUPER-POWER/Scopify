/**
 * The deliberately small transport seam used by the Playback Host control
 * broker. Keeping Electron out of the core makes its routing and lifecycle
 * rules deterministic to test.
 */
export type PlaybackHostControlPortMessageListener = (message: unknown) => void;

export interface PlaybackHostControlPort {
  close(): void;
  onClose(listener: () => void): () => void;
  onMessage(listener: PlaybackHostControlPortMessageListener): () => void;
  postMessage(message: unknown): void;
}

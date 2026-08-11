export type PlaybackBrokerPortMessageListener = (message: unknown) => void;

/**
 * The broker's transport seam. Implementations deliver already-decoded structured-clone values;
 * the broker deliberately knows nothing about Electron events or transferred ports.
 */
export interface PlaybackBrokerPort {
  close(): void;
  onClose(listener: () => void): () => void;
  onMessage(listener: PlaybackBrokerPortMessageListener): () => void;
  postMessage(message: unknown): void;
}

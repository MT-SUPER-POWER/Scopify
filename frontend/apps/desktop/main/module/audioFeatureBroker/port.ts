export type AudioFeatureBrokerPortMessageListener = (message: unknown) => void;

/**
 * The audio-feature broker's transport seam. Implementations deliver decoded
 * structured-clone values; the broker remains independent of Electron ports.
 */
export interface AudioFeatureBrokerPort {
  close(): void;
  onClose(listener: () => void): () => void;
  onMessage(listener: AudioFeatureBrokerPortMessageListener): () => void;
  postMessage(message: unknown): void;
}

import type { PlaybackCommand, PlaybackCommandReceipt } from "@scopify/desktop-contract";
export interface MainPlaybackReplica {
  dispatch(command: PlaybackCommand): void;
  dispose(): void;
  onClose(listener: () => void): () => void;
  onReceipt(listener: (receipt: PlaybackCommandReceipt) => void): () => void;
}

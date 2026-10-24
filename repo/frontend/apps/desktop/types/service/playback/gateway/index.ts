import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackProjection,
} from "@scopify/desktop-contract";
export type WithoutCommandId<TCommand extends PlaybackCommand> = TCommand extends unknown
  ? Omit<TCommand, "commandId">
  : never;

/** A trusted Main-process command. Gateway-owned IDs prevent cross-client collisions. */
export type PlaybackGatewayCommand = WithoutCommandId<PlaybackCommand>;

export type PlaybackGatewayListener<TLyrics = unknown> = (
  snapshot: PlaybackProjection<TLyrics> | null,
) => void;

/**
 * The narrow playback-control Interface used by trusted Main-process modules.
 *
 * It deliberately exposes state and commands, not Renderer transport details.
 * MCP, tray controls and future Native playback can therefore share this seam
 * without importing BrowserWindow, MessagePort, Zustand or HTMLAudioElement.
 */
export interface PlaybackGateway<TLyrics = unknown> {
  dispose(): void;
  dispatch(command: PlaybackGatewayCommand): Promise<PlaybackCommandReceipt>;
  getSnapshot(): PlaybackProjection<TLyrics> | null;
  next(): Promise<PlaybackCommandReceipt>;
  pause(): Promise<PlaybackCommandReceipt>;
  play(): Promise<PlaybackCommandReceipt>;
  previous(): Promise<PlaybackCommandReceipt>;
  seek(positionMs: number): Promise<PlaybackCommandReceipt>;
  setVolume(volume: number): Promise<PlaybackCommandReceipt>;
  subscribe(listener: PlaybackGatewayListener<TLyrics>): () => void;
  toggle(): Promise<PlaybackCommandReceipt>;
}

export interface PlaybackGatewayOptions {
  /** Injected by tests; production IDs are unguessable and unique per command. */
  commandIdFactory?(): string;
  /** Injected by tests; production callers should retain the default private ID. */
  replicaId?: string;
}

import type { PlaybackCommandReceipt, PlaybackProjection } from "@scopify/desktop-contract";
import type { McpCapability } from "@scopify/desktop-contract";
export interface McpPlaybackStatus {
  available: boolean;
  canControl: boolean;
  connection: PlaybackProjection["connection"] | "unavailable";
  durationMs: number;
  phase: PlaybackProjection["phase"] | "unavailable";
  positionMs: number;
  volume: number;
}

export interface McpNowPlaying {
  available: boolean;
  durationMs: number;
  phase: PlaybackProjection["phase"] | "unavailable";
  positionMs: number;
  track: McpPlaybackTrack | null;
}

/** The deliberately small track projection exposed to AI clients. */
export interface McpPlaybackTrack {
  albumTitle?: string;
  artistNames: string[];
  artworkUrl?: string;
  id: number | string;
  title: string;
}

export type McpPlaybackControlResult =
  | { receipt: PlaybackCommandReceipt; success: boolean }
  | { capability: McpCapability; reason: "capability-denied"; success: false };

export type McpPlaybackReadResult<TSnapshot> =
  | (TSnapshot & { success: true })
  | { capability: McpCapability; reason: "capability-denied"; success: false };

/**
 * Business adapter for MCP playback tools. It has no MCP SDK, HTTP, Electron,
 * BrowserWindow, Zustand, or Renderer imports: it can be tested with a fake
 * PlaybackGateway and will survive a future Native playback implementation.
 */
export interface McpPlaybackToolFacade {
  getNowPlaying(): McpPlaybackReadResult<McpNowPlaying>;
  getPlaybackStatus(): McpPlaybackReadResult<McpPlaybackStatus>;
  nextTrack(): Promise<McpPlaybackControlResult>;
  pause(): Promise<McpPlaybackControlResult>;
  play(): Promise<McpPlaybackControlResult>;
  previousTrack(): Promise<McpPlaybackControlResult>;
  seek(positionMs: number): Promise<McpPlaybackControlResult>;
  setVolume(volume: number): Promise<McpPlaybackControlResult>;
  togglePlayback(): Promise<McpPlaybackControlResult>;
}

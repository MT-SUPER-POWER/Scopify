/** Playback data sent from the desktop Renderer to Discord Rich Presence. */
export interface DiscordPresenceSnapshot {
  album: string;
  artist: string;
  coverUrl: string | null;
  durationMs: number;
  isPlaying: boolean;
  positionMs: number;
  sampledAtMs: number;
  title: string;
}

/** Connection and configuration state exposed to the Renderer settings UI. */
export interface DiscordPresenceStatus {
  applicationId: string | null;
  configured: boolean;
  connected: boolean;
  enabled: boolean;
  error: string | null;
  updatedAtMs: number;
}

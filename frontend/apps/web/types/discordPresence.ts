export interface DiscordPresenceSnapshotInput {
  album: string;
  artist: string;
  coverUrl: string | null;
  durationMs: number;
  isPlaying: boolean;
  positionMs: number;
  title: string;
}

export interface DiscordPresenceTrackMetadata {
  album: string;
  artistNames: string[];
  title: string;
}

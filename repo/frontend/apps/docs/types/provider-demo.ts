import type { MusicAccountRef, MusicProvider } from "@scopify/music-domain/identity";
import type { MusicTrack } from "@scopify/music-domain/track";
import type { AccountTrackState } from "@scopify/music-domain/library";

export type DemoPersonalStates = Record<string, AccountTrackState>;

export interface DemoIdentity {
  account: MusicAccountRef;
  name: string;
  providerLabel: string;
  playlistNames: readonly string[];
  cloudSupported: boolean;
}

export interface DemoQueueItem {
  queueItemId: number;
  track: MusicTrack;
}

export interface ProviderTrackCardProps {
  track: MusicTrack;
  account: MusicAccountRef;
  liked: boolean;
  onToggleLike: () => void;
  onEnqueue: () => void;
}

export type DemoIdentityRegistry = Record<MusicProvider, DemoIdentity>;

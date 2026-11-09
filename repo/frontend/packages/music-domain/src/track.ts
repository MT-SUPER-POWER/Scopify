import type { MusicResourceRef } from "./identity";

export interface MusicArtist {
  ref: MusicResourceRef<"artist">;
  name: string;
}

export interface MusicAlbum {
  ref: MusicResourceRef<"album">;
  title: string;
  coverUrl: string | null;
}

/** Shared catalog metadata. Being listed does not imply playback or collection permission. */
export interface MusicTrack {
  ref: MusicResourceRef<"track">;
  title: string;
  artists: readonly MusicArtist[];
  album: MusicAlbum | null;
  durationMs: number;
  /** Playing it in full needs a paid membership. Absent when the platform does not say. */
  requiresVip?: boolean;
  /** The ID of the song's MV on the platform, when it has one. */
  mvId?: string;
  /** The best quality it comes in beyond standard. Absent when the platform does not say. */
  bestQuality?: MusicTrackQuality;
}

/** Quality tiers above standard that a song may come in, lowest first. */
export type MusicTrackQuality = "lossless" | "hires" | "spatial" | "dolby";

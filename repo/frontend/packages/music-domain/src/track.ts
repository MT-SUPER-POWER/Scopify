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
}

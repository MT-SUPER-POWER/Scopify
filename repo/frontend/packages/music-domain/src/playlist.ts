import type { MusicAccountRef, MusicResourceRef } from "./identity";
import type { MusicTrack } from "./track";

/** Who made a playlist. Platforms that only give a display name leave `account` null. */
export interface MusicPlaylistCreator {
  account: MusicAccountRef | null;
  name: string;
  avatarUrl: string | null;
}

export type MusicPlaylistVisibility = "public" | "private";

/** What a playlist card or row shows. Counts the platform does not report are null, not 0. */
export interface MusicPlaylist {
  ref: MusicResourceRef<"playlist">;
  title: string;
  coverUrl: string | null;
  creator: MusicPlaylistCreator | null;
  /** The number of tracks the platform declares, which may differ from the tracks it serves. */
  trackCount: number;
  playCount: number | null;
}

/** A playlist's own page: the summary plus its descriptive fields. Tracks are paged apart. */
export interface MusicPlaylistDetail extends MusicPlaylist {
  description: string;
  tags: readonly string[];
  /** Creation time in milliseconds since the epoch. */
  createdAt: number | null;
  visibility: MusicPlaylistVisibility | null;
}

export interface MusicPlaylistReadOptions {
  signal?: AbortSignal;
  /**
   * The playlist was generated for the signed-in account (a personal recommendation), so it
   * must be read with that account's session rather than anonymously.
   */
  personal?: boolean;
}

export interface MusicPlaylistTrackPageRequest {
  offset: number;
  limit: number;
}

/** Tracks from `offset` on, in playlist order; fewer than asked for at the end of the list. */
export interface MusicPlaylistTrackPage {
  offset: number;
  tracks: MusicTrack[];
}

/**
 * Playlist reading, implemented by every platform with `playlist.read`. Changing a playlist's
 * tracks is optional: removal is present with `playlist.manage`.
 */
export interface MusicPlaylistSource {
  getPlaylist(
    playlist: MusicResourceRef<"playlist">,
    options?: MusicPlaylistReadOptions,
  ): Promise<MusicPlaylistDetail>;
  getPlaylistTracks(
    playlist: MusicResourceRef<"playlist">,
    page: MusicPlaylistTrackPageRequest,
    options?: MusicPlaylistReadOptions,
  ): Promise<MusicPlaylistTrackPage>;
  /** A public web address of the playlist for sharing, or null when it has none. */
  getPlaylistShareUrl?(playlist: MusicResourceRef<"playlist">): string | null;
  /** Removes tracks from a playlist the signed-in account owns. */
  removePlaylistTracks?(
    playlist: MusicResourceRef<"playlist">,
    tracks: readonly MusicResourceRef<"track">[],
  ): Promise<void>;
}

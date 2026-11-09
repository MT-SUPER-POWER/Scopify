import { musicAccountKey, musicResourceKey } from "./identity";
import type { MusicAccountRef, MusicResourceRef } from "./identity";
import type { MusicPlaylist, MusicPlaylistVisibility } from "./playlist";
import type { MusicAlbum, MusicTrack } from "./track";

/** Personal state is separate from shared catalog metadata and always names its owner. */
export interface AccountTrackState {
  account: MusicAccountRef;
  track: MusicResourceRef<"track">;
  liked: boolean;
}

export function accountTrackStateKey(
  account: MusicAccountRef,
  track: MusicResourceRef<"track">,
): string {
  return JSON.stringify([musicAccountKey(account), musicResourceKey(track)]);
}

/** Whether the account made the playlist or saved someone else's (or a generated one). */
export type MusicLibraryPlaylistRelation = "created" | "subscribed";

/** A playlist in the signed-in account's library. */
export interface MusicLibraryPlaylist {
  playlist: MusicPlaylist;
  relation: MusicLibraryPlaylistRelation;
  /** The account's own list of liked tracks, which is shown apart from the other playlists. */
  isLikedList: boolean;
  visibility: MusicPlaylistVisibility | null;
}

/** An album the account saved. */
export interface MusicLibraryAlbum {
  album: MusicAlbum;
  /** Names of the album's artists as the platform reports them; empty when it does not. */
  artistNames: readonly string[];
  /** Number of tracks, or null when the platform does not say. */
  trackCount: number | null;
  /** When the account saved it, in milliseconds since the epoch, or null when not reported. */
  savedAt: number | null;
}

/** A song in the account's cloud drive. */
export interface MusicCloudEntry {
  /** The catalog track the file matched; present only for entries that did match one. */
  track: MusicTrack;
  /** The name of the file as it was uploaded. */
  fileName: string;
  /** When it was added, in milliseconds since the epoch, or null when not reported. */
  addedAt: number | null;
  /** Whether the platform can serve audio for it; files without a match often cannot. */
  playable: boolean;
}

/** The periods a listening ranking covers. */
export type MusicListeningRankRange = "day" | "week" | "month" | "year";

/** One song of the account's listening ranking, most played first. */
export interface MusicListeningRankEntry {
  track: MusicTrack;
  /** Times the account played it in the period. */
  listenCount: number;
}

export interface MusicLibraryRequestOptions {
  signal?: AbortSignal;
}

/** New playlist input. Platforms without private playlists ignore `visibility`. */
export interface MusicCreatePlaylistInput {
  name: string;
  visibility?: MusicPlaylistVisibility;
}

/**
 * The signed-in account's library. Reading is implemented by every platform with
 * `library.playlists`; liking a track needs `track.like`; creating, renaming, deleting,
 * saving playlists and adding tracks need `playlist.manage`.
 */
export interface MusicLibrarySource {
  /**
   * Every playlist the account created or saved, complete (all pages are read). A failure
   * throws; a partial list is never returned as if it were whole.
   */
  getLibraryPlaylists(
    account: MusicAccountRef,
    options?: MusicLibraryRequestOptions,
  ): Promise<MusicLibraryPlaylist[]>;
  /** Native IDs of the tracks the account liked. */
  getLikedTrackIds(
    account: MusicAccountRef,
    options?: MusicLibraryRequestOptions,
  ): Promise<string[]>;
  /** Albums the account saved. Present when the platform has a saved-album list. */
  getLibraryAlbums?(
    account: MusicAccountRef,
    options?: MusicLibraryRequestOptions,
  ): Promise<MusicLibraryAlbum[]>;
  /** The songs in the account's cloud drive (`cloud`), whole. */
  getCloudEntries?(options?: MusicLibraryRequestOptions): Promise<MusicCloudEntry[]>;
  /** The account's most played songs in the current period (`library.rank`). */
  getListeningRank?(
    range: MusicListeningRankRange,
    options?: MusicLibraryRequestOptions,
  ): Promise<MusicListeningRankEntry[]>;
  /** Likes or unlikes one track for the signed-in account. */
  setTrackLiked?(track: MusicResourceRef<"track">, liked: boolean): Promise<void>;
  /** Creates a playlist; answers its reference when the platform reports it. */
  createPlaylist?(input: MusicCreatePlaylistInput): Promise<MusicResourceRef<"playlist"> | null>;
  renamePlaylist?(playlist: MusicResourceRef<"playlist">, name: string): Promise<void>;
  /** Deletes a playlist the account created. */
  deletePlaylist?(playlist: MusicResourceRef<"playlist">): Promise<void>;
  /** Saves or removes someone else's playlist in the library. */
  setPlaylistSubscribed?(
    playlist: MusicResourceRef<"playlist">,
    subscribed: boolean,
  ): Promise<void>;
  /** Appends tracks to a playlist the account created. */
  addPlaylistTracks?(
    playlist: MusicResourceRef<"playlist">,
    tracks: readonly MusicResourceRef<"track">[],
  ): Promise<void>;
}

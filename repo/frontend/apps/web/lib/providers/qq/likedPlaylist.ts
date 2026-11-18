import type { MusicLibraryPlaylist } from "@scopify/music-domain/library";

/**
 * The "liked songs" playlists seen in a library listing, by playlist ID. QQ serves that list
 * through its own call instead of the ordinary playlist read, so the playlist source asks
 * here whether an ID is one. A list the library has not read yet is read as any playlist.
 */
const likedPlaylists = new Map<string, MusicLibraryPlaylist>();

export function rememberQqLikedPlaylists(items: readonly MusicLibraryPlaylist[]) {
  for (const item of items) {
    if (item.isLikedList) likedPlaylists.set(item.playlist.ref.id, item);
  }
}

export function findQqLikedPlaylist(playlistId: string): MusicLibraryPlaylist | undefined {
  return likedPlaylists.get(playlistId);
}

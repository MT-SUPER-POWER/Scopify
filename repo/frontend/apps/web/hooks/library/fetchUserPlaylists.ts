import { getUserPlaylist } from "@/lib/api/playlist";
import type { RawNeteasePlaylist } from "@/types/api/playlist";

/** Fetch every page before presenting a library order for editing. */
export async function fetchUserPlaylists(userId: number) {
  const playlists: RawNeteasePlaylist[] = [];
  const seen = new Set<number>();
  for (let offset = 0; ; offset += 100) {
    const { data } = await getUserPlaylist(userId, 100, offset);
    if (data.code !== 200 || !Array.isArray(data.playlist)) {
      throw new Error("Unable to load playlists.");
    }
    for (const playlist of data.playlist) {
      if (!playlist.id || seen.has(playlist.id))
        throw new Error("Playlist list changed. Please reload.");
      seen.add(playlist.id);
      playlists.push(playlist);
    }
    if (!data.more) return playlists;
    if (data.playlist.length === 0) throw new Error("Incomplete playlist list.");
  }
}

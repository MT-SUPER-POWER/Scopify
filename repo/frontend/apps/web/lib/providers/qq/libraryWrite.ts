import type { MusicResourceRef } from "@scopify/music-domain/identity";

import { changeQqPlaylistTracks, setQqSongLiked } from "@/lib/providers/qq/api/library";
import { getQqSongBatch, QQ_SONG_BATCH_LIMIT } from "@/lib/providers/qq/api/track";
import { findQqLikedPlaylist } from "@/lib/providers/qq/likedPlaylist";

/** One playlist write takes at most this many songs. */
const PLAYLIST_WRITE_LIMIT = 100;

/** QQ names a playlist with at most 20 characters; a longer name is shortened, not refused. */
export function qqPlaylistName(name: string): string {
  return [...name.trim()].slice(0, 20).join("");
}

/** The playlist's global ID QQ's writes take; a reference of another kind of ID is refused. */
export function qqPlaylistTid(playlist: MusicResourceRef<"playlist">): number {
  const tid = Number(playlist.id);
  if (!/^\d+$/.test(playlist.id) || !Number.isSafeInteger(tid) || tid <= 0) {
    throw new Error(`QQ playlist ${playlist.id} has no numeric ID.`);
  }
  return tid;
}

/**
 * The numeric song IDs behind MIDs. Tracks are referenced by MID, but writes also name the
 * numeric ID, so it is read from the song details. A MID that does not resolve fails the call
 * instead of being skipped, so a write never touches fewer songs than asked for.
 */
export async function resolveQqSongIds(mids: readonly string[]): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  for (let index = 0; index < mids.length; index += QQ_SONG_BATCH_LIMIT) {
    const batch = mids.slice(index, index + QQ_SONG_BATCH_LIMIT);
    const data = await getQqSongBatch(batch);
    for (const entry of data.results) {
      if (entry.code === 200 && "song" in entry) ids.set(entry.song.mid, entry.song.id);
    }
  }
  const missing = mids.filter((mid) => !ids.has(mid));
  if (missing.length > 0) throw new Error(`QQ songs could not be resolved: ${missing.join(",")}`);
  return ids;
}

export async function setQqTrackLiked(track: MusicResourceRef<"track">, liked: boolean) {
  const ids = await resolveQqSongIds([track.id]);
  const id = ids.get(track.id);
  if (id === undefined) throw new Error(`QQ song ${track.id} could not be resolved.`);
  const result = await setQqSongLiked({ id, mid: track.id }, liked);
  // The backend reads the state back after writing; a different answer is a failed write.
  if (result.liked !== liked) throw new Error("QQ did not confirm the like state.");
}

export async function changeQqPlaylistTrackList(
  playlist: MusicResourceRef<"playlist">,
  op: "add" | "del",
  tracks: readonly MusicResourceRef<"track">[],
) {
  if (tracks.length === 0) return;
  // The built-in liked list is not an ordinary playlist; changing it is liking or unliking.
  if (findQqLikedPlaylist(playlist.id)) {
    for (const track of tracks) await setQqTrackLiked(track, op === "add");
    return;
  }
  const tid = qqPlaylistTid(playlist);
  const ids = await resolveQqSongIds([...new Set(tracks.map((track) => track.id))]);
  const songIds = [...ids.values()];
  for (let index = 0; index < songIds.length; index += PLAYLIST_WRITE_LIMIT) {
    await changeQqPlaylistTracks(tid, op, songIds.slice(index, index + PLAYLIST_WRITE_LIMIT));
  }
}

import { getQqSongBatch } from "@/lib/providers/qq/api/track";

const numericIds = new Map<string, string>();

/**
 * The numeric song ID behind a MID. Tracks are named by MID everywhere in the app, but QQ's
 * comment and song-MV routes only take the numeric ID, which `/song/batch` reports.
 */
export async function resolveQqSongId(mid: string, signal?: AbortSignal): Promise<string> {
  const cached = numericIds.get(mid);
  if (cached) return cached;
  const data = await getQqSongBatch([mid], signal);
  const entry = data.results[0];
  if (!entry || entry.code !== 200 || !("song" in entry)) {
    throw new Error(`QQ song ${mid} could not be resolved`);
  }
  const id = String(entry.song.id);
  numericIds.set(mid, id);
  return id;
}

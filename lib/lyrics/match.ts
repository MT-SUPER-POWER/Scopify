import type { SongSearchResource } from "@/types/api/search";
import type { NeteaseLyric, SongDetail } from "@/types/api/music";
import type { LyricMatchCandidate } from "@/types/lyrics";

export function buildLyricMatchQuery(song: SongDetail): string {
  return [song.name, song.ar.map((artist) => artist.name).join(" ")].filter(Boolean).join(" ");
}

export function mapSongSearchResourceToLyricMatchCandidate(
  resource: SongSearchResource,
): LyricMatchCandidate | null {
  const song = resource.baseInfo?.simpleSongData;
  if (!song?.id) return null;

  return {
    albumName: song.al?.name ?? "",
    artistNames: song.ar?.map((artist) => artist.name).filter(Boolean) ?? [],
    coverUrl: song.al?.picUrl ?? song.al?.blurPicUrl ?? null,
    durationMs: song.dt ?? 0,
    id: song.id,
    name: song.name ?? "",
  };
}

export function getLyricMatchScore(song: SongDetail, candidate: LyricMatchCandidate): number {
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/\s+/g, "").trim();
  const currentTitle = normalize(song.name);
  const candidateTitle = normalize(candidate.name);
  const currentArtists = new Set(song.ar.map((artist) => normalize(artist.name)));
  const artistMatched = candidate.artistNames.some((artist) =>
    currentArtists.has(normalize(artist)),
  );
  const durationMatched =
    song.dt > 0 && candidate.durationMs > 0 && Math.abs(song.dt - candidate.durationMs) <= 3_000;
  const titleScore =
    currentTitle === candidateTitle ? 60 : candidateTitle.includes(currentTitle) ? 40 : 0;

  return titleScore + (artistMatched ? 25 : 0) + (durationMatched ? 15 : 0);
}

export function hasUsableNeteaseLyric(lyric: NeteaseLyric): boolean {
  return [lyric.yrc?.lyric, lyric.lrc?.lyric].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

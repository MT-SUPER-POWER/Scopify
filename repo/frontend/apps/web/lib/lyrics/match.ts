import type { SongSearchArtist, SongSearchResource } from "@/types/providers/netease/searchApi";
import type { LyricMatchCandidate, LyricSource } from "@/types/lyrics/model";
import type { SongDetail } from "@/types/song/api";

export function buildLyricMatchQuery(song: SongDetail): string {
  return [song.name, ...song.ar.map((artist) => artist.name)].filter(Boolean).join(" ").trim();
}

const NON_LATIN_LETTER = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;
const LATIN_LETTER = /\p{Script=Latin}/u;
const INSTRUMENTAL_MARKER = /instrumental|\binst\b|off\s*vocal|karaoke|伴奏|カラオケ|インスト/iu;

function alternateArtistName(artist: SongSearchArtist): string {
  const name = typeof artist.name === "string" ? artist.name.trim() : "";
  if (!name) return name;
  const wantsLatin = NON_LATIN_LETTER.test(name);
  const aliases = [
    ...(Array.isArray(artist.tns) ? artist.tns : []),
    ...(Array.isArray(artist.alias) ? artist.alias : []),
  ];
  const alternate = aliases.find((value) => {
    if (typeof value !== "string" || !value.trim() || value.trim() === name) return false;
    return wantsLatin
      ? LATIN_LETTER.test(value) && !NON_LATIN_LETTER.test(value)
      : NON_LATIN_LETTER.test(value);
  });
  return alternate?.trim() ?? name;
}

/** Offer a second search if the default query has no likely alternative to the playing song. */
export function buildLyricMatchAliasQuery(
  song: SongDetail,
  candidates: LyricMatchCandidate[],
): string {
  if (
    candidates.some(
      (candidate) => candidate.id !== song.id && getLyricMatchScore(song, candidate) >= 85,
    )
  ) {
    return "";
  }

  const aliases = candidates.find((candidate) => candidate.id === song.id)?.alternateArtistNames;
  const artistNames = aliases ?? song.ar.map((artist) => artist.name);
  const instrumental = INSTRUMENTAL_MARKER.test(song.name);
  const title = aliases
    ? song.name
    : song.alia?.find(
        (name) =>
          typeof name === "string" &&
          name.trim() &&
          name.trim() !== song.name.trim() &&
          INSTRUMENTAL_MARKER.test(name) === instrumental,
      );
  return title ? [title.trim(), ...artistNames].filter(Boolean).join(" ") : "";
}

export function mapSongSearchResourceToLyricMatchCandidate(
  resource: SongSearchResource,
): LyricMatchCandidate | null {
  const song = resource.baseInfo?.simpleSongData;
  if (!song?.id) return null;

  const artists = song.ar ?? [];
  const artistNames = artists.map((artist) => artist.name).filter(Boolean);
  const alternateArtistNames = artists.map(alternateArtistName).filter(Boolean);
  return {
    albumName: song.al?.name ?? "",
    ...(alternateArtistNames.join(" ") !== artistNames.join(" ") ? { alternateArtistNames } : {}),
    artistNames,
    coverUrl: song.al?.picUrl ?? song.al?.blurPicUrl ?? null,
    durationMs: song.dt ?? 0,
    id: song.id,
    name: song.name ?? "",
  };
}

/** 搜索结果里能拿来匹配的曲目：没有 id 或歌名的丢掉。 */
export function toLyricMatchCandidates(resources: SongSearchResource[]): LyricMatchCandidate[] {
  return resources
    .map(mapSongSearchResourceToLyricMatchCandidate)
    .filter((candidate): candidate is LyricMatchCandidate => Boolean(candidate?.name));
}

/** 按与当前歌曲的相似度从高到低排，不改动原数组。 */
export function sortLyricMatchCandidates(
  candidates: LyricMatchCandidate[],
  song: SongDetail | null,
): LyricMatchCandidate[] {
  if (!song) return candidates;
  return [...candidates].sort(
    (left, right) => getLyricMatchScore(song, right) - getLyricMatchScore(song, left),
  );
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

export function hasUsableNeteaseLyric(lyric: LyricSource): boolean {
  return [lyric.yrc?.lyric, lyric.lrc?.lyric].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

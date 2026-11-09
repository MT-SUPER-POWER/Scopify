import type { MusicMv, MusicMvDetail, MusicMvQuality } from "@scopify/music-domain/mv";
import type { MusicArtist } from "@scopify/music-domain/track";

import { getMvCover } from "@/lib/music/mvCover";
import type { MvDetail, MvResolution, MvSummary } from "@/types/providers/netease/mvApi";

/** The search words that find an MV's neighbours: its title and main artist. */
export function getRelatedMvKeyword(mv: Pick<MusicMv, "title" | "artists">) {
  const artist = mv.artists[0]?.name.trim();
  return [mv.title.trim(), artist].filter(Boolean).join(" ");
}

function artistsOf(raw: MvSummary): MusicArtist[] {
  const credited = raw.artists?.length
    ? raw.artists
    : raw.artistId
      ? [{ id: raw.artistId, name: raw.artistName ?? "" }]
      : [];
  return credited.map((artist) => ({
    ref: { provider: "netease", kind: "artist", id: String(artist.id) },
    name: artist.name,
  }));
}

export function adaptNeteaseMv(raw: MvSummary): MusicMv {
  return {
    ref: { provider: "netease", kind: "mv", id: String(raw.id) },
    title: raw.name,
    coverUrl: getMvCover(raw) || null,
    artists: artistsOf(raw),
    // NetEase counts MV length in milliseconds.
    durationMs: raw.duration ? raw.duration : null,
    playCount: raw.playCount ?? null,
  };
}

function adaptQuality(raw: MvResolution): MusicMvQuality {
  return { height: raw.br, sizeBytes: raw.size > 0 ? raw.size : null };
}

function publishedAtOf(raw: MvDetail): number | null {
  if (!raw.publishTime) return null;
  const time = new Date(raw.publishTime).getTime();
  return Number.isNaN(time) ? null : time;
}

export function adaptNeteaseMvDetail(raw: MvDetail): MusicMvDetail {
  return {
    ...adaptNeteaseMv(raw),
    description: raw.desc || raw.briefDesc || null,
    publishedAt: publishedAtOf(raw),
    qualities: (raw.brs ?? []).filter((quality) => quality.br > 0).map(adaptQuality),
  };
}

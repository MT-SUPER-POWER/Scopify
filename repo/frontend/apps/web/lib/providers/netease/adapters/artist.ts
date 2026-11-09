import type { MusicArtistAlbum, MusicArtistDetail } from "@scopify/music-domain/artist";

import type { NeteaseArtistAlbum, NeteaseArtistDetail } from "@/types/providers/netease/artistApi";

/**
 * An artist with the fan count read beside it. The count is a second request, so a failed one
 * leaves it unknown (null) rather than failing the whole page.
 */
export function adaptNeteaseArtistDetail(
  raw: NeteaseArtistDetail,
  followerCount: number | null,
): MusicArtistDetail {
  return {
    ref: { provider: "netease", kind: "artist", id: String(raw.id) },
    name: raw.name,
    avatarUrl: raw.avatar || null,
    coverUrl: raw.cover || null,
    aliases: raw.alias ?? [],
    description: raw.briefDesc ?? "",
    followerCount,
    // NetEase has always shown the badge for every artist.
    verified: true,
  };
}

export function adaptNeteaseArtistAlbum(raw: NeteaseArtistAlbum): MusicArtistAlbum {
  return {
    ref: { provider: "netease", kind: "album", id: String(raw.id) },
    title: raw.name,
    coverUrl: raw.picUrl || null,
    publishedAt: raw.publishTime || null,
    releaseType: raw.type || null,
  };
}

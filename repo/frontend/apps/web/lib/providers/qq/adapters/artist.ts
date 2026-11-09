import type { MusicArtistAlbum, MusicArtistDetail } from "@scopify/music-domain/artist";

import { qqAlbumCoverUrl, qqSecureUrl } from "@/lib/providers/qq/adapters/playlist";
import { qqArtistAvatarUrl } from "@/lib/providers/qq/adapters/search";
import type { QqSingerAlbumDto, QqSingerDetailResponseDto } from "@/types/providers/qq/artistApi";

export function parseQqDate(date: string | undefined): number | null {
  if (!date) return null;
  const time = Date.parse(date);
  return Number.isNaN(time) ? null : time;
}

/**
 * A singer with the fan count read beside it. The count is a second request, so a failed one
 * leaves it unknown (null) rather than failing the whole page.
 */
export function adaptQqArtistDetail(
  raw: QqSingerDetailResponseDto["singer"],
  followerCount: number | null,
): MusicArtistDetail {
  return {
    ref: { provider: "qq", kind: "artist", id: raw.mid },
    name: raw.name,
    avatarUrl: qqArtistAvatarUrl(raw.mid) ?? qqSecureUrl(raw.pic),
    // QQ has no banner picture; the page falls back to the portrait.
    coverUrl: null,
    aliases: raw.foreignName ? [raw.foreignName] : [],
    description: raw.desc ?? "",
    followerCount,
    // QQ does not report verification.
    verified: false,
  };
}

export function adaptQqArtistAlbum(raw: QqSingerAlbumDto): MusicArtistAlbum {
  return {
    ref: { provider: "qq", kind: "album", id: raw.albumMid },
    title: raw.albumName,
    coverUrl: qqAlbumCoverUrl(raw.albumMid),
    publishedAt: parseQqDate(raw.publishDate),
    releaseType: raw.albumType || null,
  };
}

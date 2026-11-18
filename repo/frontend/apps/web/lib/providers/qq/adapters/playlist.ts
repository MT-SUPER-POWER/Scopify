import type { MusicPlaylistDetail } from "@scopify/music-domain/playlist";
import type { MusicTrack } from "@scopify/music-domain/track";

import { adaptQqTrack } from "@/lib/providers/qq/adapters/track";
import type { QqPlaylistDetailDto, QqPlaylistSongDto } from "@/types/providers/qq/playlistApi";

const ALBUM_MID_PATTERN = /^[0-9A-Za-z]+$/;

/**
 * QQ's album artwork address for an album MID (`T002` is the album picture). It is the same
 * address QQ's own clients and the backend build; songs without an album have none.
 */
export function qqAlbumCoverUrl(albumMid: string): string | null {
  return ALBUM_MID_PATTERN.test(albumMid)
    ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg`
    : null;
}

/** A playlist song, with its album artwork and without the empty album of a single. */
export function adaptQqPlaylistSong(raw: QqPlaylistSongDto): MusicTrack {
  const track = adaptQqTrack(raw);
  if (!track.album || !raw.album.mid) return { ...track, album: null };
  return { ...track, album: { ...track.album, coverUrl: qqAlbumCoverUrl(raw.album.mid) } };
}

/** QQ still hands out some artwork over plain HTTP; every image host serves HTTPS too. */
export function qqSecureUrl(url: string | undefined): string | null {
  return url ? url.replace(/^http:\/\//, "https://") : null;
}

/** The account number, which only session reads report; anonymous reads encrypt it. */
function creatorAccountId(uin: QqPlaylistDetailDto["uin"]): string | null {
  if (typeof uin === "number") return Number.isSafeInteger(uin) && uin > 0 ? String(uin) : null;
  return uin && /^\d+$/.test(uin) ? uin : null;
}

/** QQ writes descriptions with HTML line breaks; the page shows plain text. */
function plainDescription(desc: string | undefined): string {
  return (desc ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function adaptQqPlaylistDetail(raw: QqPlaylistDetailDto): MusicPlaylistDetail {
  const creatorName = raw.nickname || raw.nick || "";
  const accountId = creatorAccountId(raw.uin);
  const playCount = raw.visitnum ?? raw.listennum;
  return {
    ref: { provider: "qq", kind: "playlist", id: raw.disstid },
    title: raw.dissname,
    coverUrl: qqSecureUrl(raw.logo),
    creator: creatorName
      ? {
          account: accountId ? { provider: "qq", accountId } : null,
          name: creatorName,
          avatarUrl: qqSecureUrl(raw.headurl),
        }
      : null,
    trackCount: raw.total_song_num ?? raw.songnum ?? raw.songlist?.length ?? 0,
    playCount: playCount ?? null,
    description: plainDescription(raw.desc),
    // Anonymous reads list tag IDs with empty names; a tag without a name is not shown.
    tags: (raw.tags ?? []).flatMap((tag) => (tag.name ? [tag.name] : [])),
    createdAt: raw.ctime ? raw.ctime * 1000 : null,
    visibility: raw.dir_show === 1 ? "public" : raw.dir_show === 0 ? "private" : null,
  };
}

import type { MusicPlaylist, MusicPlaylistDetail } from "@scopify/music-domain/playlist";
import type { MusicToplist } from "@scopify/music-domain/recommend";

import { qqSecureUrl } from "@/lib/providers/qq/adapters/playlist";
import type {
  QqRecommendPlaylistDto,
  QqToplistDto,
  QqToplistsDto,
} from "@/types/providers/qq/recommendApi";

/**
 * QQ charts are not playlists, but they open and play through the playlist source: a chart's
 * playlist ID is its chart ID behind this prefix, which a playlist ID never starts with.
 */
export const QQ_TOPLIST_ID_PREFIX = "toplist:";

export function qqToplistPlaylistId(id: number | string): string {
  return `${QQ_TOPLIST_ID_PREFIX}${id}`;
}

/** The chart ID of a playlist ID made by {@link qqToplistPlaylistId}, or null for a playlist. */
export function qqToplistIdOf(playlistId: string): string | null {
  return playlistId.startsWith(QQ_TOPLIST_ID_PREFIX)
    ? playlistId.slice(QQ_TOPLIST_ID_PREFIX.length)
    : null;
}

export function adaptQqRecommendPlaylists(raw: readonly QqRecommendPlaylistDto[]): MusicPlaylist[] {
  return raw.map((item) => ({
    ref: { provider: "qq", kind: "playlist", id: String(item.tid) },
    title: item.title,
    coverUrl: qqSecureUrl(item.picurl),
    creator: item.creator?.nick
      ? {
          account: item.creator.uin ? { provider: "qq", accountId: item.creator.uin } : null,
          name: item.creator.nick,
          avatarUrl: qqSecureUrl(item.creator.avatar),
        }
      : null,
    trackCount: item.songnum ?? 0,
    playCount: item.play_cnt ?? null,
  }));
}

function adaptQqToplist(raw: QqToplistDto): MusicToplist {
  return {
    ref: { provider: "qq", kind: "playlist", id: qqToplistPlaylistId(raw.id) },
    title: raw.title,
    coverUrl: qqSecureUrl(raw.cover),
    // The chart's own update cadence: 1 is a daily chart, 0 a weekly one.
    updateFrequency: null,
    preview: raw.preview.map((entry) => ({
      rank: entry.rank,
      title: entry.title,
      artist: entry.singer,
    })),
  };
}

/** The first group ("巅峰榜", QQ's own charts) leads; the other groups follow in QQ's order. */
export function adaptQqToplists(raw: QqToplistsDto): MusicToplist[] {
  return raw.groups.flatMap((group) => group.toplists.map(adaptQqToplist));
}

export function adaptQqToplistDetail(raw: QqToplistDto): MusicPlaylistDetail {
  return {
    ref: { provider: "qq", kind: "playlist", id: qqToplistPlaylistId(raw.id) },
    title: raw.title,
    coverUrl: qqSecureUrl(raw.cover),
    creator: null,
    trackCount: raw.total ?? 0,
    playCount: raw.listenNum ?? null,
    // The backend's chart text is HTML with `<br>` line breaks.
    description: (raw.intro ?? "").replace(/<br\s*\/?>/gi, "\n"),
    tags: [],
    createdAt: null,
    visibility: "public",
  };
}

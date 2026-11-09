import type { MusicPlaylist, MusicPlaylistDetail } from "@scopify/music-domain/playlist";
import type {
  MusicAlbumSummary,
  MusicFeaturedArtist,
  MusicFeedShelf,
  MusicToplist,
} from "@scopify/music-domain/recommend";

import { parseQqDate } from "@/lib/providers/qq/adapters/artist";
import { adaptQqTrack } from "@/lib/providers/qq/adapters/track";
import {
  adaptQqPlaylistSong,
  qqAlbumCoverUrl,
  qqSecureUrl,
} from "@/lib/providers/qq/adapters/playlist";
import type {
  QqNewAlbumDto,
  QqFeedDto,
  QqRecommendPlaylistDto,
  QqSingerListItemDto,
  QqToplistDto,
  QqToplistsDto,
} from "@/types/providers/qq/recommendApi";
import type { QqTrackDto } from "@/types/providers/qq/trackApi";

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

export function adaptQqNewAlbums(raw: readonly QqNewAlbumDto[]): MusicAlbumSummary[] {
  return raw.map((album) => ({
    ref: { provider: "qq", kind: "album", id: album.mid },
    title: album.name,
    coverUrl: qqAlbumCoverUrl(album.mid),
    artists: album.singers.map((singer) => ({
      ref: { provider: "qq", kind: "artist", id: singer.mid },
      name: singer.name,
    })),
    publishedAt: parseQqDate(album.publishDate),
  }));
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

export function adaptQqFeaturedArtists(raw: readonly QqSingerListItemDto[]): MusicFeaturedArtist[] {
  return raw.map((singer) => ({
    ref: { provider: "qq", kind: "artist", id: singer.mid },
    name: singer.name,
    avatarUrl: singer.pic ? qqSecureUrl(singer.pic) : null,
  }));
}

/** A shelf of songs the app words itself, by its kind. */
export function qqSongShelf(kind: "guessYouLike", songs: readonly QqTrackDto[]): MusicFeedShelf[] {
  return songs.length > 0
    ? [
        {
          id: kind,
          kind,
          title: null,
          items: songs.map((song) => ({ kind: "track", track: adaptQqPlaylistSong(song) })),
        },
      ]
    : [];
}

/** A shelf of one playlist category, named as the platform names it. */
export function qqCategoryShelf(
  category: { id: number; name: string },
  playlists: readonly QqRecommendPlaylistDto[],
): MusicFeedShelf[] {
  return playlists.length > 0
    ? [
        {
          id: `category:${category.id}`,
          kind: "platform",
          title: category.name,
          items: adaptQqRecommendPlaylists(playlists).map((playlist) => ({
            kind: "playlist",
            playlist,
          })),
        },
      ]
    : [];
}

/** Shelves that hold at least one card; the title has its `{String}` filled in. */
export function adaptQqHomeFeed(raw: QqFeedDto): MusicFeedShelf[] {
  return raw.shelves.flatMap((shelf) => {
    // Its playlist shelves repeat the recommended playlists the home already shows.
    if (shelf.items.some((item) => item.type === "playlist")) return [];
    const items: MusicFeedShelf["items"][number][] = shelf.items.map((item) =>
      item.type === "song"
        ? { kind: "track", track: adaptQqTrack(item.song) }
        : {
            kind: "playlist",
            playlist: {
              ref: { provider: "qq", kind: "playlist", id: String(item.playlist.id) },
              title: item.playlist.title,
              coverUrl: qqSecureUrl(item.playlist.cover),
              creator: null,
              trackCount: 0,
              playCount: null,
            },
          },
    );
    const title = (shelf.titleTemplate ?? "").replace("{String}", shelf.titleContent ?? "").trim();
    return items.length > 0 && title
      ? [{ id: `feed:${shelf.id}`, kind: "platform", title, items }]
      : [];
  });
}

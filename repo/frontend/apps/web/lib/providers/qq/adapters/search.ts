import type { MusicPlaylist } from "@scopify/music-domain/playlist";
import type {
  MusicAlbumResult,
  MusicArtistResult,
  MusicHotSearch,
  MusicSearchSuggestion,
} from "@scopify/music-domain/search";
import type { MusicTrack } from "@scopify/music-domain/track";

import { adaptQqPlaylistSong, qqAlbumCoverUrl } from "@/lib/providers/qq/adapters/playlist";
import type {
  QqHotSearchResponseDto,
  QqSearchAlbumDto,
  QqSearchPlaylistDto,
  QqSearchSingerDto,
  QqSearchSongDto,
} from "@/types/providers/qq/searchApi";

const MID_PATTERN = /^[0-9A-Za-z]+$/;

/** The upstream wraps the matched part of a text in `<em>`; the text itself is what is shown. */
function plain(text: string | undefined): string {
  return (text ?? "").replace(/<\/?em>/g, "").trim();
}

function secureUrl(url: string | undefined): string | null {
  return url ? url.replace(/^http:\/\//, "https://") : null;
}

/** QQ's artist picture address for an artist MID (`T001` is the artist picture). */
export function qqArtistAvatarUrl(artistMid: string): string | null {
  return MID_PATTERN.test(artistMid)
    ? `https://y.gtimg.cn/music/photo_new/T001R300x300M000${artistMid}.jpg`
    : null;
}

/** A song entry, with its album artwork and without the empty album of a single. */
export function adaptQqSearchSong(raw: QqSearchSongDto): MusicTrack {
  return adaptQqPlaylistSong(raw);
}

export function adaptQqSearchArtist(raw: QqSearchSingerDto): MusicArtistResult {
  return {
    ref: { provider: "qq", kind: "artist", id: raw.singerMID },
    name: plain(raw.singerName),
    avatarUrl: qqArtistAvatarUrl(raw.singerMID),
    aliases: [],
  };
}

function parsePublishDate(date: string | undefined): number | null {
  if (!date) return null;
  const time = Date.parse(date);
  return Number.isNaN(time) ? null : time;
}

export function adaptQqSearchAlbum(raw: QqSearchAlbumDto): MusicAlbumResult {
  const artist = plain(raw.singer);
  return {
    ref: { provider: "qq", kind: "album", id: raw.albummid },
    title: plain(raw.name),
    coverUrl: qqAlbumCoverUrl(raw.albummid) ?? secureUrl(raw.pic),
    // The entry names its artists but not which they are, so there is no artist to link to.
    artists: artist ? [{ ref: null, name: artist }] : [],
    publishedAt: parsePublishDate(raw.publish_date),
  };
}

export function adaptQqSearchPlaylist(raw: QqSearchPlaylistDto): MusicPlaylist {
  const creator = plain(raw.nickname);
  return {
    ref: { provider: "qq", kind: "playlist", id: raw.dissid },
    title: plain(raw.dissname),
    coverUrl: secureUrl(raw.logo),
    creator: creator ? { account: null, name: creator, avatarUrl: null } : null,
    trackCount: raw.songnum ?? 0,
    playCount: raw.listennum ?? null,
  };
}

export function adaptQqHotSearches(raw: QqHotSearchResponseDto): MusicHotSearch[] {
  return raw.hotkeys.map((hotkey) => ({ keyword: hotkey.keyword }));
}

/** QQ gives plain keywords, so a suggestion is its keyword with nothing marked. */
export function adaptQqSearchSuggestion(keyword: string): MusicSearchSuggestion {
  return { keyword, highlights: [{ text: keyword, matched: true }], tag: null };
}

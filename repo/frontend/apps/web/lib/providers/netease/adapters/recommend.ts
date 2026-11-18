import type { MusicPlaylist } from "@scopify/music-domain/playlist";
import type { MusicAlbumSummary, MusicToplist } from "@scopify/music-domain/recommend";

import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { pruneRecommendPlaylist, type RawRecommendPlaylist } from "@/types/playlist/api";
import type { PlayerTrack } from "@/types/player/model";
import type {
  NeteaseNewestAlbumDto,
  NeteaseNewSongItemDto,
  NeteaseToplistDto,
} from "@/types/providers/netease/recommendApi";
import { pruneSongDetail, type RawSongDetail } from "@/types/song/api";

/** NetEase's official charts, shown before the rest on the home page. */
const OFFICIAL_TOPLIST_IDS = [19723756, 3779629, 3778678, 2884035];

/** Playlists of the recommendation endpoints; entries without an ID or name are dropped. */
export function adaptNeteaseRecommendedPlaylists(
  raw: readonly RawRecommendPlaylist[] | undefined,
): MusicPlaylist[] {
  return (raw ?? []).flatMap((item) => {
    const playlist = pruneRecommendPlaylist(item);
    if (!playlist.id) return [];
    return [
      {
        ref: { provider: "netease", kind: "playlist", id: String(playlist.id) },
        title: playlist.name,
        coverUrl: playlist.picUrl || null,
        creator: null,
        trackCount: playlist.trackCount,
        playCount: playlist.playCount,
      },
    ];
  });
}

export function adaptNeteaseRecommendedSongs(raw: readonly RawSongDetail[]): PlayerTrack[] {
  return raw.map((song) => adaptNeteaseTrack(pruneSongDetail(song)));
}

export function adaptNeteaseNewSongs(raw: readonly NeteaseNewSongItemDto[] | undefined) {
  return (raw ?? []).flatMap((item) =>
    item.song?.id ? [adaptNeteaseTrack(pruneSongDetail(item.song))] : [],
  );
}

export function adaptNeteaseNewAlbums(
  raw: readonly NeteaseNewestAlbumDto[] | undefined,
): MusicAlbumSummary[] {
  return (raw ?? []).flatMap((album) => {
    if (!album.id || !album.name) return [];
    // The shelf has always named the main artist only.
    const artists = album.artist ? [album.artist] : (album.artists ?? []);
    return [
      {
        ref: { provider: "netease", kind: "album", id: String(album.id) },
        title: album.name,
        coverUrl: album.picUrl || null,
        artists: artists.flatMap((artist) =>
          artist.name
            ? [
                {
                  ref: {
                    provider: "netease" as const,
                    kind: "artist" as const,
                    id: String(artist.id ?? ""),
                  },
                  name: artist.name,
                },
              ]
            : [],
        ),
        publishedAt: album.publishTime ?? null,
      },
    ];
  });
}

/** Charts that list their top songs: the official ones first, then the rest. */
export function adaptNeteaseToplists(
  raw: readonly NeteaseToplistDto[] | undefined,
): MusicToplist[] {
  const list = (raw ?? []).filter((item) => item.tracks?.length);
  const official = OFFICIAL_TOPLIST_IDS.flatMap((id) => list.filter((item) => item.id === id));
  const remaining = list.filter((item) => !OFFICIAL_TOPLIST_IDS.includes(item.id));
  return [...official, ...remaining].map((item) => ({
    ref: { provider: "netease", kind: "playlist", id: String(item.id) },
    title: item.name,
    coverUrl: item.coverImgUrl || null,
    updateFrequency: item.updateFrequency || null,
    preview: (item.tracks ?? []).map((entry, index) => ({
      rank: index + 1,
      title: entry.first,
      artist: entry.second,
    })),
  }));
}

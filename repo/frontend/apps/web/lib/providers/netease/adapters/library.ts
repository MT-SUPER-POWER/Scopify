import type { MusicAccountRef } from "@scopify/music-domain/identity";
import type { MusicLibraryAlbum, MusicLibraryPlaylist } from "@scopify/music-domain/library";
import type { MusicPlaylistVisibility } from "@scopify/music-domain/playlist";

import type { NeteaseUserAlbum } from "@/types/album/releaseApi";
import { getPlaylistTrackCount } from "@/types/playlist/api";
import type { RawNeteasePlaylist } from "@/types/providers/netease/playlistApi";

/** NetEase marks the account's liked-songs playlist with this special type. */
const LIKED_PLAYLIST_SPECIAL_TYPE = 5;

function visibilityOf(privacy: number | undefined): MusicPlaylistVisibility | null {
  if (privacy === 0) return "public";
  if (privacy === 10) return "private";
  return null;
}

/** A playlist the account created is told apart from a saved one by its creator. */
export function adaptNeteaseLibraryPlaylist(
  raw: RawNeteasePlaylist,
  account: MusicAccountRef,
): MusicLibraryPlaylist {
  const creatorId = raw.creator?.userId;
  return {
    playlist: {
      ref: { provider: "netease", kind: "playlist", id: String(raw.id ?? 0) },
      title: raw.name ?? "",
      coverUrl: raw.coverImgUrl ?? raw.picUrl ?? null,
      creator: raw.creator
        ? {
            account:
              creatorId === undefined
                ? null
                : { provider: "netease", accountId: String(creatorId) },
            name: raw.creator.nickname ?? "",
            avatarUrl: raw.creator.avatarUrl || null,
          }
        : null,
      trackCount: getPlaylistTrackCount(raw),
      playCount: raw.playCount ?? null,
    },
    relation:
      creatorId !== undefined && String(creatorId) === account.accountId ? "created" : "subscribed",
    isLikedList: raw.specialType === LIKED_PLAYLIST_SPECIAL_TYPE,
    visibility: visibilityOf(raw.privacy),
  };
}

export function adaptNeteaseLibraryAlbum(raw: NeteaseUserAlbum): MusicLibraryAlbum {
  return {
    album: {
      ref: { provider: "netease", kind: "album", id: String(raw.id) },
      title: raw.name,
      coverUrl: raw.picUrl || null,
    },
    artistNames: [],
    trackCount: raw.size ? raw.size : null,
    savedAt: raw.subTime || null,
  };
}

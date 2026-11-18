import type { MusicPlaylistDetail, MusicPlaylistVisibility } from "@scopify/music-domain/playlist";

import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import type { PlayerTrack } from "@/types/player/model";
import type {
  NeteasePlaylistExtras,
  NeteasePlaylistTracksDto,
  RawNeteasePlaylist,
} from "@/types/providers/netease/playlistApi";
import { pruneSongDetail, type SongDetail } from "@/types/song/api";

/** Songs of a track page with their playback privileges merged back in. */
export function pruneNeteasePlaylistTracks(response: NeteasePlaylistTracksDto): SongDetail[] {
  const privilegesBySongId = new Map(
    (response.privileges ?? []).map((privilege) => [privilege.id, privilege]),
  );

  return (response.songs ?? []).map((song) =>
    pruneSongDetail({
      ...song,
      privilege: privilegesBySongId.get(song.id) ?? song.privilege,
    }),
  );
}

export function adaptNeteasePlaylistTracks(response: NeteasePlaylistTracksDto): PlayerTrack[] {
  return pruneNeteasePlaylistTracks(response).map(adaptNeteaseTrack);
}

function visibilityOf(privacy: number | undefined): MusicPlaylistVisibility | null {
  if (privacy === 0) return "public";
  if (privacy === 10) return "private";
  return null;
}

export function adaptNeteasePlaylistDetail(
  raw: RawNeteasePlaylist,
  id: string,
): MusicPlaylistDetail & { readonly netease: NeteasePlaylistExtras } {
  const creatorId = raw.creator?.userId;
  return {
    ref: { provider: "netease", kind: "playlist", id: raw.id === undefined ? id : String(raw.id) },
    title: raw.name ?? "",
    coverUrl: raw.coverImgUrl || null,
    creator: raw.creator
      ? {
          account:
            creatorId === undefined ? null : { provider: "netease", accountId: String(creatorId) },
          name: raw.creator.nickname ?? "",
          avatarUrl: raw.creator.avatarUrl || null,
        }
      : null,
    // The ID list is complete even when `trackCount` lags behind it.
    trackCount: raw.trackIds?.length ?? raw.trackCount ?? 0,
    playCount: raw.playCount ?? null,
    description: raw.description ?? "",
    tags: raw.tags ?? [],
    createdAt: raw.createTime ?? null,
    visibility: visibilityOf(raw.privacy),
    netease: {
      specialType: raw.specialType,
      subscribed: raw.subscribed ?? false,
      subscribedCount: raw.subscribedCount ?? 0,
    },
  };
}

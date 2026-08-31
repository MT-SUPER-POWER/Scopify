import { getAlbumDetail } from "@/lib/api/album";
import { getArtistTopSongs } from "@/lib/api/artist";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { getRadioPrograms } from "@/lib/api/radio";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type {
  CommandWorkspaceSearchItem,
  CommandWorkspaceTrackList,
} from "@/types/commandWorkspace";
import type { RadioProgram } from "@/types/api/radio";

export async function loadCommandWorkspaceTrackList(
  item: CommandWorkspaceSearchItem,
): Promise<CommandWorkspaceTrackList> {
  switch (item.kind) {
    case "song":
      return { title: item.entity.name, tracks: [toCommandWorkspaceSongDetail(item.entity)] };
    case "voice":
      if (!item.entity.mainSong || item.entity.isPlayable === false) {
        throw new Error("该节目当前没有可播放曲目。");
      }
      return {
        description: item.entity.podcastName,
        title: item.entity.name,
        tracks: [toVoiceSongDetail(item.entity.mainSong, item.entity.coverUrl, item.entity.id)],
      };
    case "playlist": {
      const response = await getPlaylistAllTracks({
        cookie: getMusicSessionCredential() ?? "",
        id: item.entity.id,
      });
      return {
        description: item.entity.creator?.nickname,
        title: item.entity.name,
        tracks: (response.data.songs ?? []).map(pruneSongDetail),
      };
    }
    case "album": {
      const response = await getAlbumDetail(item.entity.id);
      const coverUrl = item.entity.picUrl ?? item.entity.blurPicUrl ?? "";
      return {
        description: item.entity.artist.name,
        title: item.entity.name,
        tracks: (response.data.songs ?? []).map((song) =>
          pruneSongDetail({
            ...song,
            al: {
              id: song.al?.id ?? item.entity.id,
              name: song.al?.name ?? item.entity.name,
              picUrl: song.al?.picUrl ?? coverUrl,
            },
          }),
        ),
      };
    }
    case "artist": {
      const response = await getArtistTopSongs(item.entity.id);
      return {
        description: "热门歌曲",
        title: item.entity.name,
        tracks: (response.data.songs ?? []).map(pruneSongDetail),
      };
    }
    case "podcast":
      return loadPodcastTrackList(item.entity);
  }
}

export function toCommandWorkspaceSongDetail(
  song: Extract<CommandWorkspaceSearchItem, { kind: "song" }>["entity"],
): SongDetail {
  const picUrl = song.album.picUrl ?? song.album.blurPicUrl ?? song.artists[0]?.picUrl ?? "";
  return {
    al: { id: song.album.id, name: song.album.name, picUrl },
    ar: song.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    dt: song.duration,
    fee: song.fee ?? 0,
    id: song.id,
    name: song.name,
    publishTime: song.album.publishTime,
  };
}

async function loadPodcastTrackList(
  podcast: Extract<CommandWorkspaceSearchItem, { kind: "podcast" }>["entity"],
): Promise<CommandWorkspaceTrackList> {
  if (podcast.source === "voice-list") {
    throw new Error("该播客列表暂未提供可播放节目。");
  }

  const response = await getRadioPrograms({ id: podcast.id });
  const programs = response.data.data?.programs ?? response.data.programs ?? [];
  return {
    description: podcast.hostName,
    title: podcast.name,
    tracks: programs.map((program) => toPodcastProgramTrack(program, podcast)),
  };
}

function toPodcastProgramTrack(
  program: RadioProgram,
  podcast: Extract<CommandWorkspaceSearchItem, { kind: "podcast" }>["entity"],
): SongDetail {
  const track = pruneSongDetail(program.mainSong);
  return {
    ...track,
    al: {
      ...track.al,
      id: podcast.id,
      name: podcast.name,
      picUrl: program.coverUrl ?? track.al.picUrl ?? podcast.coverUrl,
    },
    dt: program.duration ?? track.dt,
    name: program.name ?? track.name,
    publishTime: program.createTime ?? track.publishTime,
    voiceId: program.id,
  };
}

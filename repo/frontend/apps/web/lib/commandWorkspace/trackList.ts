import type { MusicProviderClient } from "@scopify/music-domain/provider";
import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { getRadioPrograms } from "@/lib/providers/netease/api/radio";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import { pruneSongDetail, type SongDetail } from "@/types/song/api";
import type {
  CommandWorkspaceSearchItem,
  CommandWorkspaceTrackList,
} from "@/types/commandWorkspace/model";
import type { RadioProgram } from "@/types/radio/api";

export async function loadCommandWorkspaceTrackList(
  item: CommandWorkspaceSearchItem,
  provider: MusicProviderClient,
): Promise<CommandWorkspaceTrackList> {
  switch (item.kind) {
    case "song":
      return { title: item.entity.title, tracks: [item.entity] };
    case "voice":
      if (!item.entity.mainSong || item.entity.isPlayable === false) {
        throw new Error("该节目当前没有可播放曲目。");
      }
      return {
        description: item.entity.podcastName,
        title: item.entity.name,
        tracks: [
          adaptNeteaseTrack(
            toVoiceSongDetail(item.entity.mainSong, item.entity.coverUrl, item.entity.id),
          ),
        ],
      };
    case "playlist": {
      const { tracks } = await provider.getPlaylistTracks(item.entity.ref, {
        offset: 0,
        limit: Math.max(item.entity.trackCount, 1),
      });
      return {
        description: item.entity.creator?.name,
        title: item.entity.title,
        tracks,
      };
    }
    case "album": {
      const { tracks } = await provider.getAlbum(item.entity.ref);
      return {
        description: item.entity.artists[0]?.name,
        title: item.entity.title,
        tracks,
      };
    }
    case "artist":
      return {
        description: "热门歌曲",
        title: item.entity.name,
        tracks: await provider.getArtistTopTracks(item.entity.ref),
      };
    case "podcast":
      return loadPodcastTrackList(item.entity);
  }
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
    tracks: programs.map((program) => adaptNeteaseTrack(toPodcastProgramTrack(program, podcast))),
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

import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import type {
  RecommendedVoice,
  RecommendedVoiceArtist,
  RecommendedVoiceSong,
} from "@/types/voice/api";
import type { Artist, Song, Voice } from "@/types/search/model";

function toArtist(source: RecommendedVoiceArtist): Artist {
  return {
    id: source.id ?? 0,
    name: source.name ?? "",
    picUrl: source.picUrl ?? null,
  };
}

function toSong(
  source: RecommendedVoiceSong | undefined,
  fallbackCoverUrl: string,
  unknownAlbumName: string,
  unknownSongName: string,
): Song | null {
  if (!source?.id) return null;

  const artists = (source.artists ?? source.ar ?? []).map(toArtist);
  const album = source.album ?? source.al;

  return {
    album: {
      artist: artists[0] ?? { id: 0, name: "", picUrl: null },
      id: album?.id ?? 0,
      name: album?.name ?? unknownAlbumName,
      picUrl: resolveCoverUrl(album?.picUrl, album?.blurPicUrl, fallbackCoverUrl),
      publishTime: 0,
      size: 0,
    },
    artists,
    duration: source.duration ?? source.dt ?? 0,
    id: source.id,
    name: source.name ?? unknownSongName,
  };
}

export function toRecommendedVoice(
  voice: RecommendedVoice,
  fallbackPodcastName: string,
  unknownAlbumName: string,
  unknownSongName: string,
): Voice | null {
  if (!voice.id) return null;

  const coverUrl = voice.picUrl ?? "";
  const mainSong = toSong(voice.djProgram?.mainSong, coverUrl, unknownAlbumName, unknownSongName);

  return {
    coverUrl,
    duration: voice.duration ?? mainSong?.duration ?? 0,
    hostName: voice.djProgram?.dj?.nickname,
    id: voice.id,
    mainSong,
    name: voice.name ?? unknownSongName,
    podcastName: voice.radioName ?? fallbackPodcastName,
  };
}

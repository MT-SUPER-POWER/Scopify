import type { Artist, Song, Voice } from "@/types/search/model";
import type { LikedVoice } from "@/types/voice/api";

function toLikedVoiceArtist(source: { id?: number; name?: string; picUrl?: string }): Artist {
  return {
    id: source.id ?? 0,
    name: source.name ?? "",
    picUrl: source.picUrl ?? null,
  };
}

function toLikedVoiceSong(source: LikedVoice): Song | null {
  const song = [source.mainSong, source.djProgram?.mainSong].find(
    (candidate) =>
      candidate?.id != null &&
      Number.isSafeInteger(Number(candidate.id)) &&
      Number(candidate.id) > 0,
  );
  if (!song) return null;

  const artists = (song.artists ?? song.ar ?? []).map(toLikedVoiceArtist);
  const album = song.album ?? song.al;

  return {
    album: {
      artist: artists[0] ?? { id: 0, name: "", picUrl: null },
      id: album?.id ?? 0,
      name: album?.name ?? "",
      picUrl: album?.picUrl ?? album?.blurPicUrl,
      publishTime: 0,
      size: 0,
    },
    artists,
    duration: song.duration ?? song.dt ?? 0,
    id: Number(song.id),
    name: song.name ?? "",
  };
}

export function toLikedVoice(source: LikedVoice): Voice | null {
  const id = Number(source.voiceId ?? source.id ?? source.contentId);
  const name = source.voiceName ?? source.name ?? source.contentName;
  if (!Number.isSafeInteger(id) || id <= 0 || !name) return null;

  const mainSong = toLikedVoiceSong(source);
  return {
    coverUrl:
      source.coverUrl ?? source.picUrl ?? source.contentCoverUrl ?? mainSong?.album.picUrl ?? "",
    description: source.voiceDesc,
    duration: source.duration ?? mainSong?.duration ?? 0,
    hostName: source.userName ?? source.dj?.nickname ?? source.djProgram?.dj?.nickname,
    id,
    // Listing and audit status describe the catalog, not whether the account can stream the audio.
    // The player checks actual availability when a track is requested.
    isPlayable: mainSong !== null,
    lastPlayTime: source.lastPlayTime,
    likeTime: source.likeTime,
    mainSong,
    name,
    podcastName: source.voiceListName ?? source.radioName ?? "",
    playCount: source.playCount,
    publishTime: source.publishTime,
  };
}

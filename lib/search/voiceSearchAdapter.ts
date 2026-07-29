import type { VoiceSearchItem, VoiceSearchProgram, VoiceSearchResponse } from "@/types/api/search";
import type { Artist, Song, Voice } from "@/types/search";

function toVoiceSearchArtist(source: {
  id?: number;
  name?: string;
  picUrl?: string | null;
}): Artist {
  return {
    id: source.id ?? 0,
    name: source.name ?? "",
    picUrl: source.picUrl ?? null,
  };
}

function toVoiceSearchSong(
  source: VoiceSearchProgram,
  unknownAlbumName: string,
  unknownSongName: string,
): Song | null {
  const song = source.mainSong;
  const id = Number(song?.id);
  if (!song || !Number.isFinite(id)) return null;

  const artists = (song.artists ?? song.ar ?? []).map(toVoiceSearchArtist);
  const album = song.album ?? song.al;

  return {
    album: {
      artist: artists[0] ?? { id: 0, name: "", picUrl: null },
      id: album?.id ?? 0,
      name: album?.name ?? unknownAlbumName,
      picUrl: album?.picUrl ?? album?.blurPicUrl ?? undefined,
      publishTime: 0,
      size: 0,
    },
    alias: song.alias ?? song.alia ?? [],
    artists,
    duration: song.duration ?? song.dt ?? 0,
    fee: song.fee,
    id,
    name: song.name ?? unknownSongName,
  };
}

function getResourceTitle(title: string | undefined) {
  return title?.replace(/^声音\s*[:：]\s*/, "");
}

export function getVoiceSearchItems(response: VoiceSearchResponse | undefined) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;

  return (
    payload?.voices ??
    payload?.voiceList ??
    payload?.resources ??
    payload?.data ??
    payload?.list ??
    response?.voices ??
    response?.result?.voices ??
    response?.result?.voiceList ??
    response?.result?.resources ??
    response?.result?.data ??
    response?.result?.list ??
    response?.list ??
    []
  );
}

export function hasMoreVoiceSearchResults(response: VoiceSearchResponse | undefined) {
  const payload = response?.data;
  if (Array.isArray(payload)) return response?.hasMore ?? response?.more;

  return (
    payload?.hasMore ??
    payload?.more ??
    response?.hasMore ??
    response?.more ??
    response?.result?.hasMore ??
    response?.result?.more
  );
}

export function mapVoiceSearchItem(
  voice: VoiceSearchItem,
  unknownAlbumName: string,
  unknownPodcastName: string,
  unknownSongName: string,
): Voice | null {
  const baseInfo = voice.baseInfo ?? voice;
  const id = Number(voice.voiceId ?? voice.id ?? baseInfo.id ?? voice.resourceId);
  if (!Number.isFinite(id)) return null;

  const mainSong = toVoiceSearchSong(baseInfo, unknownAlbumName, unknownSongName);

  return {
    coverUrl:
      voice.coverUrl ??
      voice.picUrl ??
      voice.contentCoverUrl ??
      baseInfo.coverUrl ??
      baseInfo.picUrl ??
      voice.radio?.picUrl ??
      baseInfo.radio?.picUrl ??
      voice.uiElement?.image?.imageUrl ??
      mainSong?.album.picUrl ??
      "",
    duration: voice.duration ?? baseInfo.duration ?? mainSong?.duration ?? 0,
    hostName: voice.userName ?? voice.dj?.nickname ?? baseInfo.userName ?? baseInfo.dj?.nickname,
    id,
    mainSong,
    name:
      voice.voiceName ??
      voice.name ??
      baseInfo.voiceName ??
      baseInfo.name ??
      mainSong?.name ??
      getResourceTitle(voice.uiElement?.mainTitle?.title) ??
      unknownSongName,
    podcastName:
      voice.voiceListName ??
      voice.radioName ??
      voice.radio?.name ??
      baseInfo.voiceListName ??
      baseInfo.radioName ??
      baseInfo.radio?.name ??
      unknownPodcastName,
  };
}

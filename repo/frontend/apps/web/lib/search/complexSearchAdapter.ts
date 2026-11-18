import type {
  ComplexSearchResponse,
  ComplexSearchVoiceListData,
  ComplexSearchVoiceMainSong,
  ComplexSearchVoiceProgramData,
  SearchArtistSource,
} from "@/types/providers/netease/searchApi";
import type { Artist, Podcast, Song, Voice } from "@/types/search/model";

function isValidPicUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith("http");
}

function mapArtist(source: SearchArtistSource | undefined): Artist {
  return {
    albumSize: source?.albumSize,
    alias: source?.alias,
    fansSize: source?.fansSize,
    id: source?.id ?? 0,
    img1v1Url: source?.img1v1Url,
    musicSize: source?.musicSize,
    name: source?.name ?? "",
    picUrl: isValidPicUrl(source?.picUrl) ? source.picUrl : null,
  };
}

function mapPodcast(source: ComplexSearchVoiceListData): Podcast {
  const score = Number(source.score);

  return {
    category: source.category,
    coverUrl: source.picUrl ?? "",
    description: source.desc,
    hostName: source.dj?.nickname,
    id: source.id,
    name: source.name,
    programCount: source.programCount ?? 0,
    score: Number.isFinite(score) ? score : undefined,
    source: "dj-radio",
    subscriberCount: source.subCount ?? 0,
  };
}

function mapVoiceMainSong(
  source: ComplexSearchVoiceMainSong | undefined,
  unknownAlbumName: string,
  unknownSongName: string,
): Song | null {
  if (!source) return null;

  const artists = source.artists?.map(mapArtist) ?? [];
  const albumPicUrl = isValidPicUrl(source.album?.picUrl)
    ? source.album.picUrl
    : isValidPicUrl(source.album?.blurPicUrl)
      ? source.album.blurPicUrl
      : "";

  return {
    album: {
      artist: artists[0] ?? mapArtist(undefined),
      id: source.album?.id ?? 0,
      name: source.album?.name ?? unknownAlbumName,
      picUrl: albumPicUrl,
      publishTime: 0,
      size: 0,
    },
    alias: source.alias ?? [],
    artists,
    duration: source.duration ?? 0,
    fee: source.fee,
    id: source.id,
    name: source.name ?? unknownSongName,
  };
}

function mapVoice(
  source: ComplexSearchVoiceProgramData,
  unknownAlbumName: string,
  unknownPodcastName: string,
  unknownSongName: string,
): Voice {
  const mainSong = mapVoiceMainSong(source.mainSong, unknownAlbumName, unknownSongName);

  return {
    coverUrl: source.coverUrl ?? source.radio?.picUrl ?? mainSong?.album.picUrl ?? "",
    duration: source.duration ?? mainSong?.duration ?? 0,
    hostName: source.dj?.nickname ?? source.radio?.dj?.nickname,
    id: source.id,
    mainSong,
    name: source.name ?? mainSong?.name ?? unknownSongName,
    podcastName: source.radio?.name ?? unknownPodcastName,
  };
}

function findBlockResources(response: ComplexSearchResponse, blockCode: string) {
  return response.data?.blocks?.find((block) => block.blockCode === blockCode)?.resources ?? [];
}

/** The podcast and voice blocks of a complex search; the other blocks are interface types. */
export function mapComplexSearchMedia(
  response: ComplexSearchResponse | undefined,
  unknownAlbumName: string,
  unknownSongName: string,
  unknownPodcastName = "Unknown Podcast",
): { podcasts: Podcast[]; voices: Voice[] } {
  if (!response) return { podcasts: [], voices: [] };

  const podcasts = findBlockResources(response, "search_block_voicelist")
    .map((resource) => resource.baseInfo?.pubDJRadioData)
    .filter((podcast): podcast is ComplexSearchVoiceListData => podcast !== undefined)
    .map(mapPodcast);
  const voices = findBlockResources(response, "search_block_voice")
    .map((resource) => resource.baseInfo?.pubDJProgramData)
    .filter((voice): voice is ComplexSearchVoiceProgramData => voice !== undefined)
    .map((voice) => mapVoice(voice, unknownAlbumName, unknownPodcastName, unknownSongName));

  return { podcasts, voices };
}

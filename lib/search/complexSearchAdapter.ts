import type {
  ComplexSearchAlbumData,
  ComplexSearchResource,
  ComplexSearchResponse,
  ComplexSearchVoiceListData,
  ComplexSearchVoiceMainSong,
  ComplexSearchVoiceProgramData,
  SearchArtistSource,
  SearchResultArtist,
  SearchResultPlaylist,
  SongSearchData,
} from "@/types/api/search";
import type {
  Album,
  Artist,
  Playlist,
  Podcast,
  SearchBestMatch,
  SearchResults,
  Song,
  Voice,
} from "@/types/search";

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

function mapAlbum(source: ComplexSearchAlbumData, unknownAlbumName: string): Album {
  const artist = source.artist ?? source.artists?.[0];

  return {
    artist: mapArtist(artist),
    blurPicUrl: source.blurPicUrl,
    id: source.id,
    name: source.name || unknownAlbumName,
    picUrl: source.picUrl,
    publishTime: source.publishTime ?? 0,
    size: source.size ?? 0,
  };
}

function mapPlaylist(source: SearchResultPlaylist): Playlist {
  return {
    bookCount: source.bookCount,
    coverImgUrl: source.coverImgUrl ?? "",
    creator: source.creator,
    description: source.description ?? undefined,
    id: source.id,
    name: source.name,
    playCount: source.playCount ?? 0,
    trackCount: source.trackCount ?? 0,
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

function mapSong(source: SongSearchData, unknownAlbumName: string, unknownSongName: string): Song {
  const artists = source.ar?.map(mapArtist) ?? [];
  const albumPicUrl = isValidPicUrl(source.al?.picUrl)
    ? source.al.picUrl
    : isValidPicUrl(source.al?.blurPicUrl)
      ? source.al.blurPicUrl
      : "";

  return {
    album: {
      artist: artists[0] ?? mapArtist(undefined),
      id: source.al?.id ?? 0,
      name: source.al?.name ?? unknownAlbumName,
      picUrl: albumPicUrl,
      publishTime: 0,
      size: 0,
    },
    alias: source.alia ?? source.alias ?? [],
    artists,
    duration: source.dt ?? 0,
    fee: source.fee,
    id: source.id,
    mvid: source.mvid,
    name: source.name ?? unknownSongName,
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

function mapBestMatch(
  resource: ComplexSearchResource,
  unknownAlbumName: string,
  unknownSongName: string,
): SearchBestMatch | null {
  switch (resource.resourceType) {
    case "album": {
      const album = resource.baseInfo?.albumData;
      return album ? { album: mapAlbum(album, unknownAlbumName), kind: "album" } : null;
    }
    case "artist": {
      const artist = resource.baseInfo?.artistDTO;
      return artist ? { artist: mapArtist(artist), kind: "artist" } : null;
    }
    case "playlist": {
      const playlist = resource.baseInfo?.pubPlaylistData;
      return playlist ? { kind: "playlist", playlist: mapPlaylist(playlist) } : null;
    }
    case "song": {
      const song = resource.baseInfo?.simpleSongData;
      return song ? { kind: "song", song: mapSong(song, unknownAlbumName, unknownSongName) } : null;
    }
    default:
      return null;
  }
}

export function mapComplexSearchResponse(
  response: ComplexSearchResponse | undefined,
  unknownAlbumName: string,
  unknownSongName: string,
  unknownPodcastName = "Unknown Podcast",
): SearchResults {
  const emptyResults: SearchResults = {
    albums: [],
    artists: [],
    bestMatch: null,
    podcasts: [],
    playlists: [],
    songs: [],
    voices: [],
  };
  if (!response) return emptyResults;

  const songs = findBlockResources(response, "search_block_song")
    .map((resource) => resource.baseInfo?.simpleSongData)
    .filter((song): song is SongSearchData => song !== undefined)
    .map((song) => mapSong(song, unknownAlbumName, unknownSongName));
  const artists = findBlockResources(response, "search_block_artist")
    .map((resource) => resource.baseInfo?.artistDTO)
    .filter((artist): artist is SearchResultArtist => artist !== undefined)
    .map(mapArtist);
  const albums = findBlockResources(response, "search_block_album")
    .map((resource) => resource.baseInfo?.albumData)
    .filter((album): album is ComplexSearchAlbumData => album !== undefined)
    .map((album) => mapAlbum(album, unknownAlbumName));
  const playlists = findBlockResources(response, "search_block_playlist")
    .map((resource) => resource.baseInfo?.pubPlaylistData)
    .filter((playlist): playlist is SearchResultPlaylist => playlist !== undefined)
    .map(mapPlaylist);
  const podcasts = findBlockResources(response, "search_block_voicelist")
    .map((resource) => resource.baseInfo?.pubDJRadioData)
    .filter((podcast): podcast is ComplexSearchVoiceListData => podcast !== undefined)
    .map(mapPodcast);
  const voices = findBlockResources(response, "search_block_voice")
    .map((resource) => resource.baseInfo?.pubDJProgramData)
    .filter((voice): voice is ComplexSearchVoiceProgramData => voice !== undefined)
    .map((voice) => mapVoice(voice, unknownAlbumName, unknownPodcastName, unknownSongName));
  const bestMatch =
    findBlockResources(response, "search_block_best_match")
      .map((resource) => mapBestMatch(resource, unknownAlbumName, unknownSongName))
      .find((match): match is SearchBestMatch => match !== null) ?? null;

  return { albums, artists, bestMatch, podcasts, playlists, songs, voices };
}

export interface SearchArtistSource {
  albumSize?: number;
  alias?: string[];
  fansSize?: number | null;
  id?: number;
  img1v1Url?: string;
  musicSize?: number;
  name?: string;
  picUrl?: string | null;
}

export interface SongSearchArtist extends SearchArtistSource {
  id: number;
  name: string;
  picUrl?: string;
}

export interface SongSearchAlbum {
  id: number;
  name: string;
  picUrl?: string;
  blurPicUrl?: string;
}

export interface SongSearchData {
  alia?: string[];
  alias?: string[];
  ar?: SongSearchArtist[];
  dt?: number;
  fee?: number;
  id: number;
  name?: string;
  al?: SongSearchAlbum;
}

export interface SongSearchResource {
  baseInfo?: {
    simpleSongData?: SongSearchData;
  };
}

export interface SongSearchResponse {
  code: number;
  data?: {
    resources?: SongSearchResource[];
  };
}

export interface SearchResultArtist extends SearchArtistSource {
  id: number;
  name: string;
}

export interface SearchResultAlbum {
  artist?: SearchResultArtist;
  blurPicUrl?: string;
  id: number;
  name: string;
  picUrl?: string;
  publishTime?: number;
  size?: number;
}

export interface SearchResultPlaylist {
  bookCount?: number;
  coverImgUrl?: string;
  creator?: {
    nickname: string;
  };
  description?: null | string;
  id: number;
  name: string;
  playCount?: number;
  trackCount?: number;
}

export interface AlbumSearchResponse {
  code: number;
  result?: {
    albums?: SearchResultAlbum[];
  };
}

export interface ArtistSearchResponse {
  code: number;
  result?: {
    artists?: SearchResultArtist[];
  };
}

export interface PlaylistSearchResponse {
  code: number;
  result?: {
    playlists?: SearchResultPlaylist[];
  };
}

export interface ComplexSearchAlbumData {
  artist?: SearchResultArtist;
  artists?: SearchResultArtist[];
  blurPicUrl?: string;
  id: number;
  name: string;
  picUrl?: string;
  publishTime?: number;
  size?: number;
}

export interface ComplexSearchDj {
  avatarUrl?: string;
  nickname?: string;
}

export interface ComplexSearchVoiceListData {
  category?: string;
  desc?: string;
  dj?: ComplexSearchDj;
  id: number;
  name: string;
  picUrl?: string;
  programCount?: number;
  subCount?: number;
}

export interface ComplexSearchVoiceAlbum {
  blurPicUrl?: string;
  id?: number;
  name?: string;
  picUrl?: string;
}

export interface ComplexSearchVoiceMainSong {
  alias?: string[];
  album?: ComplexSearchVoiceAlbum;
  artists?: SearchArtistSource[];
  duration?: number;
  fee?: number;
  id: number;
  name?: string;
}

export interface ComplexSearchVoiceProgramData {
  coverUrl?: string;
  dj?: ComplexSearchDj;
  duration?: number;
  id: number;
  mainSong?: ComplexSearchVoiceMainSong;
  name?: string;
  radio?: ComplexSearchVoiceListData;
}

export interface ComplexSearchResourceBaseInfo {
  albumData?: ComplexSearchAlbumData;
  artistDTO?: SearchResultArtist;
  pubDJProgramData?: ComplexSearchVoiceProgramData;
  pubDJRadioData?: ComplexSearchVoiceListData;
  pubPlaylistData?: SearchResultPlaylist;
  simpleSongData?: SongSearchData;
}

export interface ComplexSearchResource {
  baseInfo?: ComplexSearchResourceBaseInfo;
  blockCode?: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
}

export interface ComplexSearchBlock {
  blockCode: string;
  resources?: ComplexSearchResource[];
}

export interface ComplexSearchResponse {
  code: number;
  data?: {
    blocks?: ComplexSearchBlock[];
    cursor?: {
      page?: number;
      traceId?: string;
    };
  };
}

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
  mvid?: number;
  name?: string;
  al?: SongSearchAlbum;
}

export interface SongSearchResource {
  baseInfo?: {
    simpleSongData?: SongSearchData;
  };
}

export interface SearchPagination {
  hasMore?: boolean;
  more?: boolean;
}

export interface SongSearchPayload extends SearchPagination {
  resources?: SongSearchResource[];
}

export interface SongSearchResponse extends SearchPagination {
  code: number;
  data?: SongSearchPayload;
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

export interface AlbumSearchResult extends SearchPagination {
  albums?: SearchResultAlbum[];
}

export interface ArtistSearchResult extends SearchPagination {
  artists?: SearchResultArtist[];
}

export interface PlaylistSearchResult extends SearchPagination {
  playlists?: SearchResultPlaylist[];
}

export interface AlbumSearchResponse extends SearchPagination {
  code: number;
  result?: AlbumSearchResult;
}

export interface ArtistSearchResponse extends SearchPagination {
  code: number;
  result?: ArtistSearchResult;
}

export interface PlaylistSearchResponse extends SearchPagination {
  code: number;
  result?: PlaylistSearchResult;
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
  score?: number | string;
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

export interface VoiceSearchArtist extends SearchArtistSource {
  id?: number;
  name?: string;
}

export interface VoiceSearchAlbum {
  blurPicUrl?: string;
  id?: number;
  name?: string | null;
  picUrl?: string | null;
}

export interface VoiceSearchSong {
  al?: VoiceSearchAlbum;
  album?: VoiceSearchAlbum;
  alia?: string[];
  alias?: string[];
  ar?: VoiceSearchArtist[];
  artists?: VoiceSearchArtist[];
  dt?: number;
  duration?: number;
  fee?: number;
  id?: number | string;
  name?: string;
}

export interface VoiceSearchProgram {
  contentCoverUrl?: string;
  coverUrl?: string;
  dj?: ComplexSearchDj;
  duration?: number;
  id?: number | string;
  mainSong?: VoiceSearchSong;
  name?: string;
  picUrl?: string;
  radio?: {
    name?: string;
    picUrl?: string;
  };
  radioName?: string;
  userName?: string;
  voiceId?: number | string;
  voiceListName?: string;
  voiceName?: string;
}

export interface VoiceSearchUiElement {
  image?: {
    imageUrl?: string;
  };
  mainTitle?: {
    title?: string;
  };
}

export interface VoiceSearchItem extends VoiceSearchProgram {
  baseInfo?: VoiceSearchProgram;
  resourceId?: number | string;
  uiElement?: VoiceSearchUiElement;
}

export interface VoiceSearchPayload extends SearchPagination {
  data?: VoiceSearchItem[];
  list?: VoiceSearchItem[];
  resources?: VoiceSearchItem[];
  voiceList?: VoiceSearchItem[];
  voices?: VoiceSearchItem[];
}

export interface VoiceSearchResponse extends SearchPagination {
  code: number;
  data?: VoiceSearchItem[] | VoiceSearchPayload;
  list?: VoiceSearchItem[];
  result?: VoiceSearchPayload;
  voices?: VoiceSearchItem[];
}

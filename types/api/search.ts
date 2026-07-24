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

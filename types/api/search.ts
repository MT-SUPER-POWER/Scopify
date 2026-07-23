export interface SongSearchArtist {
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
  ar?: SongSearchArtist[];
  dt?: number;
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

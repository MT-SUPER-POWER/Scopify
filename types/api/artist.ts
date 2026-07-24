import type { FollowedArtist } from "@/types/artist";
import type { RawSongDetail } from "@/types/api/music";

export interface ArtistDetailResponse {
  code: number;
  data: {
    artist: NeteaseArtistDetail;
    videoCount: number;
  };
  message: string;
}

export interface ArtistFollowCountResponse {
  code: number;
  data: {
    fansCnt: number;
    follow: boolean;
    followCnt: number;
    isFollow: boolean;
  };
  message: string;
}

export interface ArtistTopSongsResponse {
  code: number;
  more: boolean;
  songs: RawSongDetail[];
  total: number;
}

export interface ArtistAlbumsResponse {
  code: number;
  hotAlbums: NeteaseArtistAlbum[];
  more: boolean;
}

/** `/top/artists` 的实际歌手项。 */
export interface NeteaseHotArtist {
  accountId: null | number;
  alg: null | string;
  albumSize: number;
  alias: string[];
  briefDesc: string;
  fansCount: number;
  followed: boolean;
  id: number;
  identifyTag: null | string;
  img1v1Id: number;
  img1v1Id_str: string;
  img1v1Url: string;
  isSubed: boolean | null;
  mvSize: null | number;
  musicSize: number;
  name: string;
  picId: number;
  picId_str: string;
  picUrl: string;
  publishTime: null | number;
  showPrivateMsg: null | boolean;
  topicPerson: number;
  trans: string;
  transNames: null | string[];
}

export interface HotArtistsResponse {
  artists?: NeteaseHotArtist[];
  code: number;
  more: boolean;
}

export interface NeteaseArtistAlbum {
  id: number;
  name: string;
  picUrl: string;
  publishTime: number;
  type: string;
}

export interface NeteaseArtistDetail {
  alias: string[];
  avatar: string;
  briefDesc: string;
  cover: string;
  id: number;
  name: string;
}

export interface FollowedArtistsResponse {
  code: number;
  data?: FollowedArtist[];
}

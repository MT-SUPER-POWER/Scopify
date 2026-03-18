import request from "../web/request";


export interface Track {
  id: string;
  title: string;
  playCount: number; // 播放次数
  durationMs: number; // 毫秒级时长
  coverUrl: string;
}

export interface Album {
  id: string;
  title: string;
  releaseYear: number;
  type: 'Album' | 'Single' | 'EP';
  coverUrl: string;
}

export interface Artist {
  id: string;
  name: string;
  isVerified: boolean;
  monthlyListeners: number;
  headerImageUrl: string;
  avatarUrl: string;
  bio: string;
}

export interface ArtistPageData {
  artist: Artist;
  popularTracks: Track[];
  discography: Album[];
}


/**
 * 获取歌手详情
 */
export function getRecommendedSongs(id: number | string) {
  return request.get('/artists/detail', {
    params: {
      id,
    }
  })
}

/**
 * 获取热门歌手列表
 */
export function getHotArtists(limit: number = 10) {
  return request.get('/top/artists', {
    params: {
      limit
    }
  });
}


export function getAritstDetail(id: number | string) {
  return request.get('/artist/detail', {
    params: { id }
  });
}


export function getFansCnt(id: number | string) {
  return request.get('/artist/follow/count', {
    params: { id }
  });
}

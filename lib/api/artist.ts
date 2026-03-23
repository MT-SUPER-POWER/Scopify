import request from "../web/request";

export interface Track {
  id: string;
  title: string;
  playCount: number;
  durationMs: number;
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
    params: { id }
  })
}

/**
 * 获取热门歌手列表
 */
export function getHotArtists(limit: number = 10) {
  return request.get('/top/artists', {
    params: { limit }
  });
}

/**
 * 获取歌手详情（含 briefDesc、cover 等）
 */
export function getAritstDetail(id: number | string) {
  return request.get('/artist/detail', {
    params: { id }
  });
}

/**
 * 获取歌手粉丝数
 */
export function getFansCnt(id: number | string) {
  return request.get('/artist/follow/count', {
    params: { id }
  });
}

/**
 * 获取歌手热门歌曲（返回 artist + hotSongs）
 */
export function getArtistTopSongs(id: number | string) {
  return request.get('/artists', {
    params: { id }
  });
}

/**
 * 获取歌手专辑列表
 * @param id 歌手 id
 * @param limit 数量，默认 30
 * @param offset 分页偏移
 */
export function getArtistAlbums(id: number | string, limit = 10, offset = 0) {
  return request.get('/artist/album', {
    params: { id, limit, offset }
  });
}

/**
 * 获取歌手 MV 列表
 */
export function getArtistMVs(id: number | string) {
  return request.get('/artist/mv', {
    params: { id }
  });
}

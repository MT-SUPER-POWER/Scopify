import type {
  AlbumSearchResponse,
  ArtistSearchResponse,
  ComplexSearchResponse,
  PlaylistSearchResponse,
  SongSearchResponse,
} from "@/types/api/search";
import request from "../web/request";

/**
 * 搜索建议
 * @return res.data.showKeyword
 */
export function searchDefault(cookie?: string) {
  return request.get("/v1/search/default/keyword/pc", {
    params: {
      cookie,
    },
  });
}

/**
 * 搜索热词
 */
export function searchHot() {
  return request.get("/search/hot");
}

/**
 * 输入一点内容就下拉的搜索意见栏
 */
export function searchSuggest(keyword: string, cookie?: string) {
  return request.get("/search/suggest/pc", {
    params: {
      keyword: keyword,
      cookie,
    },
  });
}

export function searchSongs(keyword: string, limit = 15, offset = 0) {
  return request.get<SongSearchResponse>("/v1/search/song/pc", {
    params: {
      keyword: keyword,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

export function searchPlaylists(s: string, limit = 15, offset = 0) {
  return request.get<PlaylistSearchResponse>("/v1/search/playlist/pc", {
    params: {
      s: s,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

export function searchAlbums(s: string, limit = 15, offset = 0) {
  return request.get<AlbumSearchResponse>("/v1/search/album/pc", {
    params: {
      s: s,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

export function searchArtists(s: string, limit = 15, offset = 0) {
  return request.get<ArtistSearchResponse>("/v1/search/artist/pc", {
    params: {
      s: s,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

export function searchComplex(keyword: string) {
  return request.get<ComplexSearchResponse>("/search/pc/complex/page/v3", {
    params: {
      keyword,
    },
  });
}

// TODO: 电台、声音

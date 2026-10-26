import type {
  AlbumSearchResponse,
  ArtistSearchResponse,
  ComplexSearchResponse,
  LyricSearchResponse,
  MvSearchResponse,
  PlaylistSearchResponse,
  SongSearchResponse,
  VoiceSearchResponse,
} from "@/types/api/search";
import request from "../web/request";

/**
 * 搜索建议
 * @return res.data.showKeyword
 */
export function searchDefault() {
  return request.get("/v1/search/default/keyword/pc");
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
export function searchSuggest(keyword: string) {
  return request.get("/search/suggest/pc", {
    params: {
      keyword: keyword,
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

export function searchVoices(keyword: string, limit = 30, offset = 0) {
  return request.get<VoiceSearchResponse>("/search", {
    params: {
      keywords: keyword,
      limit,
      offset,
      type: 2000,
    },
  });
}

/** 搜索 MV；新版 PC 搜索接口不含 MV，使用 cloudsearch 的 MV 类型（1004）。 */
export function searchMVs(keyword: string, limit = 24, offset = 0) {
  return request.get<MvSearchResponse>("/cloudsearch", {
    params: {
      keywords: keyword,
      limit,
      offset,
      type: 1004,
    },
  });
}

/** 按歌词搜索；使用 /search/lyric 接口，返回包含该歌词片段的歌曲与匹配行。 */
export function searchLyrics(keyword: string, limit = 30, offset = 0) {
  return request.get<LyricSearchResponse>("/search/lyric", {
    params: {
      keyword,
      limit,
      offset,
    },
  });
}

// TODO: 电台、声音

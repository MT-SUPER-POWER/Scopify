import request from "../web/request";

/**
 * 搜索建议
 * @return res.data.showKeyword
 */
export function searchDefault() {
  return request.get("/v1/search/default/keyword/pc", {
    params: {
      cookie: localStorage.getItem("music_cookie") || "",
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
export function searchSuggest(keyword: string) {
  return request.get("/search/suggest/pc", {
    params: {
      keyword: keyword,
      cookie: localStorage.getItem("music_cookie") || "",
    },
  });
}

export function searchSongs(keyword: string, limit = 15, offset = 0) {
  return request.get("/v1/search/song/pc", {
    params: {
      keyword: keyword,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

export function searchPlaylists(s: string, limit = 15, offset = 0) {
  return request.get("/v1/search/playlist/pc", {
    params: {
      s: s,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

export function searchAlbums(s: string, limit = 15, offset = 0) {
  return request.get("/v1/search/album/pc", {
    params: {
      s: s,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

export function searchArtists(s: string, limit = 15, offset = 0) {
  return request.get("/v1/search/artist/pc", {
    params: {
      s: s,
      limit: limit,
      offset: offset,
      needCorrect: true,
    },
  });
}

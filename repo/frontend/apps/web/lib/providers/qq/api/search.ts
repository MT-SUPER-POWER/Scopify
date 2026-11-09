import { qqClient } from "@/lib/providers/qq/client";
import type {
  QqHotSearchResponseDto,
  QqSearchAlbumDto,
  QqSearchPlaylistDto,
  QqSearchResponseDto,
  QqSearchSingerDto,
  QqSearchSongDto,
  QqSearchSuggestResponseDto,
} from "@/types/providers/qq/searchApi";

/** The most results the backend serves per page. */
export const QQ_SEARCH_PAGE_LIMIT = 20;

interface QqSearchItems {
  song: QqSearchSongDto;
  singer: QqSearchSingerDto;
  album: QqSearchAlbumDto;
  playlist: QqSearchPlaylistDto;
}

/** One page of results; `page` starts at 1. A search without matches is an empty page. */
export function searchQq<Type extends keyof QqSearchItems>(
  type: Type,
  keyword: string,
  page: number,
  limit: number,
  signal?: AbortSignal,
) {
  return qqClient.requestData<QqSearchResponseDto<QqSearchItems[Type]>>({
    method: "GET",
    url: "/search",
    params: { keyword, type, page, limit },
    signal,
    errorContext: { operation: "qq.search", type },
  });
}

export function getQqHotSearches(signal?: AbortSignal) {
  return qqClient.requestData<QqHotSearchResponseDto>({
    method: "GET",
    url: "/search/hot",
    signal,
    errorContext: { operation: "qq.search.hot" },
  });
}

export function getQqSearchSuggestions(keyword: string, signal?: AbortSignal) {
  return qqClient.requestData<QqSearchSuggestResponseDto>({
    method: "GET",
    url: "/search/suggest",
    params: { keyword },
    signal,
    errorContext: { operation: "qq.search.suggest" },
  });
}

import type {
  MusicSearchKind,
  MusicSearchPage,
  MusicSearchResultMap,
  MusicSearchSource,
} from "@scopify/music-domain/search";

import {
  adaptNeteaseSearchAlbum,
  adaptNeteaseSearchArtist,
  adaptNeteaseSearchOverview,
  adaptNeteaseSearchPlaylist,
  adaptNeteaseSearchSong,
  adaptNeteaseSuggestion,
} from "@/lib/providers/netease/adapters/search";
import {
  searchAlbums,
  searchArtists,
  searchComplex,
  searchDefault,
  searchPlaylists,
  searchSongs,
  searchSuggest,
} from "@/lib/providers/netease/api/search";

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

/** The platform's own "more" flag, wherever the endpoint puts it. */
function getHasMore(response: unknown): boolean | undefined {
  const record = toRecord(response);
  for (const candidate of [record, toRecord(record?.data), toRecord(record?.result)]) {
    if (typeof candidate?.hasMore === "boolean") return candidate.hasMore;
    if (typeof candidate?.more === "boolean") return candidate.more;
  }
  return undefined;
}

/**
 * Where the next page starts. A page counts what the platform sent, including entries that
 * could not be shown; without a "more" flag a full page means there may be another.
 */
export function getNeteaseSearchNextOffset(
  response: unknown,
  offset: number,
  limit: number,
  receivedCount: number,
): number | null {
  const hasMore = getHasMore(response);
  if (receivedCount === 0 || hasMore === false) return null;
  if (hasMore === undefined && receivedCount < limit) return null;
  return offset + receivedCount;
}

function page<Item>(
  items: Item[],
  response: unknown,
  offset: number,
  limit: number,
  receivedCount: number,
): MusicSearchPage<Item> {
  return {
    offset,
    items,
    nextOffset: getNeteaseSearchNextOffset(response, offset, limit, receivedCount),
  };
}

type Searchers = {
  [Kind in MusicSearchKind]: (
    keyword: string,
    offset: number,
    limit: number,
    signal?: AbortSignal,
  ) => Promise<MusicSearchPage<MusicSearchResultMap[Kind]>>;
};

const searchers: Searchers = {
  async song(keyword, offset, limit, signal) {
    const { data } = await searchSongs(keyword, limit, offset, signal);
    const resources = data.data?.resources ?? [];
    const items = resources.flatMap((resource) => {
      const song = resource.baseInfo?.simpleSongData;
      return song ? [adaptNeteaseSearchSong(song)] : [];
    });
    return page(items, data, offset, limit, resources.length);
  },
  async artist(keyword, offset, limit, signal) {
    const { data } = await searchArtists(keyword, limit, offset, signal);
    const artists = data.result?.artists ?? [];
    return page(artists.map(adaptNeteaseSearchArtist), data, offset, limit, artists.length);
  },
  async album(keyword, offset, limit, signal) {
    const { data } = await searchAlbums(keyword, limit, offset, signal);
    const albums = data.result?.albums ?? [];
    return page(albums.map(adaptNeteaseSearchAlbum), data, offset, limit, albums.length);
  },
  async playlist(keyword, offset, limit, signal) {
    const { data } = await searchPlaylists(keyword, limit, offset, signal);
    const playlists = data.result?.playlists ?? [];
    return page(playlists.map(adaptNeteaseSearchPlaylist), data, offset, limit, playlists.length);
  },
};

export const neteaseSearchSource: MusicSearchSource = {
  search({ keyword, kind, offset, limit }, signal) {
    // The table is keyed by kind, so the entry always returns the result type of that kind.
    return searchers[kind](keyword, offset, limit, signal) as Promise<
      MusicSearchPage<MusicSearchResultMap[typeof kind]>
    >;
  },

  async getHotSearches(signal) {
    const { data } = await searchDefault(signal);
    return (data.data?.algWords ?? []).map((word) => ({ keyword: word.keyword }));
  },

  async getSearchSuggestions(keyword, signal) {
    const { data } = await searchSuggest(keyword, signal);
    return (data.data?.suggests ?? []).map(adaptNeteaseSuggestion);
  },

  async searchOverview(keyword, signal) {
    const { data } = await searchComplex(keyword, signal);
    return adaptNeteaseSearchOverview(data);
  },
};

import type {
  MusicSearchKind,
  MusicSearchPage,
  MusicSearchResultMap,
  MusicSearchSource,
} from "@scopify/music-domain/search";

import {
  adaptQqHotSearches,
  adaptQqSearchAlbum,
  adaptQqSearchArtist,
  adaptQqSearchPlaylist,
  adaptQqSearchSong,
  adaptQqSearchSuggestion,
} from "@/lib/providers/qq/adapters/search";
import {
  getQqHotSearches,
  getQqSearchMatch,
  getQqSearchSuggestions,
  QQ_SEARCH_PAGE_LIMIT,
  searchQq,
} from "@/lib/providers/qq/api/search";
import { getQqSongBatch } from "@/lib/providers/qq/api/track";
import {
  adaptQqPlaylistSong,
  qqAlbumCoverUrl,
  qqSecureUrl,
} from "@/lib/providers/qq/adapters/playlist";
import { qqArtistAvatarUrl } from "@/lib/providers/qq/adapters/search";
import { isApiError } from "@/lib/web/apiError";
import type { QqSearchResponseDto } from "@/types/providers/qq/searchApi";

/**
 * QQ pages by number. A page holds at most {@link QQ_SEARCH_PAGE_LIMIT} results, and the page
 * size is fixed for a search, so an offset is a whole number of pages.
 */
function toPage(offset: number, limit: number): { page: number; limit: number } {
  const size = Math.min(Math.max(limit, 1), QQ_SEARCH_PAGE_LIMIT);
  if (offset % size !== 0) {
    throw new Error(`QQ search offset ${offset} is not a multiple of the page size ${size}.`);
  }
  return { page: offset / size + 1, limit: size };
}

function pageOf<Raw, Item>(
  response: QqSearchResponseDto<Raw>,
  offset: number,
  adapt: (raw: Raw) => Item,
): MusicSearchPage<Item> {
  return {
    offset,
    items: response.items.map(adapt),
    nextOffset: response.more && response.items.length > 0 ? offset + response.items.length : null,
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
    const paging = toPage(offset, limit);
    const response = await searchQq("song", keyword, paging.page, paging.limit, signal);
    return pageOf(response, offset, adaptQqSearchSong);
  },
  async artist(keyword, offset, limit, signal) {
    const paging = toPage(offset, limit);
    const response = await searchQq("singer", keyword, paging.page, paging.limit, signal);
    return pageOf(response, offset, adaptQqSearchArtist);
  },
  async album(keyword, offset, limit, signal) {
    const paging = toPage(offset, limit);
    const response = await searchQq("album", keyword, paging.page, paging.limit, signal);
    return pageOf(response, offset, adaptQqSearchAlbum);
  },
  async playlist(keyword, offset, limit, signal) {
    const paging = toPage(offset, limit);
    const response = await searchQq("playlist", keyword, paging.page, paging.limit, signal);
    return pageOf(response, offset, adaptQqSearchPlaylist);
  },
};

/** The backend answers 422 when the platform has nothing to offer; that is no suggestions. */
function isNothingToOffer(error: unknown): boolean {
  return isApiError(error) && error.status === 422;
}

export const qqSearchSource: MusicSearchSource = {
  search({ keyword, kind, offset, limit }, signal) {
    // The table is keyed by kind, so the entry always returns the result type of that kind.
    return searchers[kind](keyword, offset, limit, signal) as Promise<
      MusicSearchPage<MusicSearchResultMap[typeof kind]>
    >;
  },

  async getHotSearches(signal) {
    try {
      return adaptQqHotSearches(await getQqHotSearches(signal));
    } catch (error) {
      if (isNothingToOffer(error)) return [];
      throw error;
    }
  },

  async getSearchBestMatch(keyword, signal) {
    let response;
    try {
      response = await getQqSearchMatch(keyword, signal);
    } catch (error) {
      if (isNothingToOffer(error)) return null;
      throw error;
    }
    // The first group by rank that holds a kind the best match can show.
    const groups = (["song", "singer", "album"] as const)
      .flatMap((kind) => {
        const group = response.data[kind];
        const item = group?.itemlist[0];
        return group && item ? [{ kind, order: group.order, item }] : [];
      })
      .sort((a, b) => a.order - b.order);
    const hit = groups[0];
    if (!hit) return null;
    const { item } = hit;
    if (hit.kind === "song") {
      const batch = await getQqSongBatch([item.mid], signal);
      const entry = batch.results[0];
      if (!entry || entry.code !== 200 || !("song" in entry)) return null;
      return { kind: "song", song: adaptQqPlaylistSong(entry.song) };
    }
    if (hit.kind === "singer") {
      return {
        kind: "artist",
        artist: {
          ref: { provider: "qq", kind: "artist", id: item.mid },
          name: item.name,
          avatarUrl: qqSecureUrl(item.pic) ?? qqArtistAvatarUrl(item.mid),
          aliases: [],
        },
      };
    }
    return {
      kind: "album",
      album: {
        ref: { provider: "qq", kind: "album", id: item.mid },
        title: item.name,
        coverUrl: qqAlbumCoverUrl(item.mid) ?? qqSecureUrl(item.pic),
        artists: item.singer ? [{ ref: null, name: item.singer }] : [],
        publishedAt: null,
      },
    };
  },

  async getSearchSuggestions(keyword, signal) {
    try {
      const response = await getQqSearchSuggestions(keyword, signal);
      return response.suggestions.map(adaptQqSearchSuggestion);
    } catch (error) {
      if (isNothingToOffer(error)) return [];
      throw error;
    }
  },
};

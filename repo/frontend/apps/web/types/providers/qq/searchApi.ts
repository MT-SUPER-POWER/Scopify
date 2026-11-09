import type { QqTrackDto } from "@/types/providers/qq/trackApi";

/**
 * GET /search. `items` are the upstream entries as they are, so the fields below are only the
 * ones read. Text can still carry `<em>` markers where the upstream highlighted the keyword.
 */
export interface QqSearchResponseDto<Item> {
  code: 200;
  type: "song" | "singer" | "album" | "playlist";
  page: number;
  limit: number;
  /** Matches in all, when the upstream says. */
  total?: number;
  /** The upstream's own next-page flag. */
  more: boolean;
  items: Item[];
}

/** A song entry, the same fields as a song of `/song/batch`. */
export type QqSearchSongDto = QqTrackDto;

export interface QqSearchSingerDto {
  singerMID: string;
  singerName: string;
}

export interface QqSearchAlbumDto {
  albummid: string;
  name: string;
  /** The artists as one display string. */
  singer: string;
  /** Release date as `YYYY-MM-DD`, empty when unknown. */
  publish_date?: string;
  pic?: string;
}

export interface QqSearchPlaylistDto {
  dissid: string;
  dissname: string;
  logo?: string;
  nickname?: string;
  songnum?: number;
  listennum?: number;
}

/** GET /search/hot */
export interface QqHotSearchResponseDto {
  code: 200;
  hotkeys: { keyword: string; title?: string; description?: string }[];
}

/** GET /search/suggest; a keyword without any suggestion is answered with 422. */
export interface QqSearchSuggestResponseDto {
  code: 200;
  keyword: string;
  suggestions: string[];
}

import type { QqTrackDto } from "@/types/providers/qq/trackApi";

/** A playlist of GET /recommend/playlists, flattened by the backend into the usual list fields. */
export interface QqRecommendPlaylistDto {
  tid: number;
  title: string;
  desc?: string;
  /** Some covers are still plain HTTP. */
  picurl: string;
  songnum?: number;
  play_cnt?: number;
  creator?: { uin?: string; nick?: string; avatar?: string };
}

/** GET /recommend/playlists. Signed in, the backend reads it with the account. */
export interface QqRecommendPlaylistsDto {
  code: 200;
  playlists: QqRecommendPlaylistDto[];
  more: boolean;
}

/** GET /recommend/new-songs. */
export interface QqNewSongsDto {
  code: 200;
  area: number;
  songs: QqTrackDto[];
}

/** An album of GET /recommend/new-albums. */
export interface QqNewAlbumDto {
  mid: string;
  name: string;
  singers: { mid: string; name: string }[];
  /** Release date as `YYYY-MM-DD`. */
  publishDate?: string;
}

/** GET /recommend/new-albums: the newest albums of the default area. */
export interface QqNewAlbumsDto {
  code: 200;
  albums: QqNewAlbumDto[];
}

/** GET /user/daily-songs. Needs the account session. */
export interface QqDailySongsDto {
  code: 200;
  songs: QqTrackDto[];
}

/**
 * GET /user/personal-fm. Needs the account session. `nextPage` is present when the station has
 * more to serve; asking for it again continues the stream.
 */
export interface QqPersonalFmDto {
  code: 200;
  page: number;
  songs: QqTrackDto[];
  more: boolean;
  station: "personal-fm";
  nextPage?: number;
  paginationLimitReached?: true;
}

/** A chart of GET /recommend/toplists. */
export interface QqToplistDto {
  id: number;
  title: string;
  /** Update period, e.g. `2026-11-09` for a daily chart. */
  period?: string;
  /** 1 for a daily chart, 0 for a weekly one. */
  updateType?: number;
  total?: number;
  intro?: string;
  listenNum?: number;
  /** Plain HTTP address of the chart artwork. */
  cover?: string;
  preview: { rank: number; title: string; singer: string }[];
}

/** GET /recommend/toplists: charts in groups ("巅峰榜", regional charts…). */
export interface QqToplistsDto {
  code: 200;
  groups: { id: number; name: string; toplists: QqToplistDto[] }[];
}

/** GET /recommend/toplist?id=…: songs in rank order. */
export interface QqToplistSongsDto {
  code: 200;
  toplist: Omit<QqToplistDto, "preview">;
  songs: QqTrackDto[];
  total?: number;
  more: boolean;
}

/** A singer of GET /singer/list. */
export interface QqSingerListItemDto {
  mid: string;
  name: string;
  id?: number;
  /** Plain HTTP address of the portrait. */
  pic?: string;
  otherName?: string;
}

/** GET /singer/list: popular singers, most popular first. */
export interface QqSingerListDto {
  code: 200;
  singers: QqSingerListItemDto[];
}

/** A card of GET /recommend/feed: a song (as /song/batch gives it) or a playlist. */
export type QqFeedItemDto =
  | { type: "song"; song: QqTrackDto }
  | {
      type: "playlist";
      playlist: { id: number | string; title: string; subtitle?: string; cover?: string };
    };

/** GET /recommend/feed: the first page of the client's home feed, as shelves. */
export interface QqFeedDto {
  code: 200;
  page: number;
  more: boolean;
  shelves: {
    id: string;
    /** May hold a `{String}` placeholder that `titleContent` fills. */
    titleTemplate?: string;
    titleContent?: string;
    items: QqFeedItemDto[];
  }[];
}

/** GET /user/guess-you-like and GET /recommend/radar: one batch of songs. */
export interface QqSongBatchStationDto {
  code: 200;
  songs: QqTrackDto[];
}

/** GET /recommend/categories: playlist categories in groups. */
export interface QqPlaylistCategoriesDto {
  code: 200;
  groups: { id: number; name: string; categories: { id: number; name: string }[] }[];
}

/** GET /recommend/category-playlists?id=…: the playlists of one category. */
export interface QqCategoryPlaylistsDto {
  code: 200;
  playlists: QqRecommendPlaylistDto[];
}

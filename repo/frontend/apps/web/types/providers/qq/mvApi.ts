/** An MV of the list routes (/mv/list, /song/mvs). Times are in seconds. */
export interface QqMvDto {
  vid: string;
  title: string;
  id?: number;
  cover?: string;
  playCount?: number;
  /** Seconds. */
  duration?: number;
  /** Seconds since the epoch. */
  publishTime?: number;
  singers: { mid: string; name: string }[];
}

/** GET /mv/list. */
export interface QqMvListDto {
  code: 200;
  mvs: QqMvDto[];
  total?: number;
  more: boolean;
}

/** GET /mv/detail. */
export interface QqMvDetailDto {
  code: 200;
  mv: QqMvDto & { desc?: string };
}

/** One quality of GET /mv/url. `quality` is QQ's file type (10, 20, 30). */
export interface QqMvFileDto {
  quality: number;
  size?: number;
  urls: string[];
}

/** GET /mv/url; only the qualities that have a link. */
export interface QqMvUrlDto {
  code: 200;
  vid: string;
  files: QqMvFileDto[];
}

/** GET /song/mvs. The song is named by its numeric ID, not its MID. */
export interface QqSongMvsDto {
  code: 200;
  mvs: QqMvDto[];
  more: boolean;
}

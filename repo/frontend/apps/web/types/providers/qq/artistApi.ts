import type { QqTrackDto } from "@/types/providers/qq/trackApi";

/** GET /singer/detail. A singer that does not exist is answered with 422. */
export interface QqSingerDetailResponseDto {
  code: 200;
  singer: {
    mid: string;
    id: number;
    name: string;
    /** A 300 px portrait, over plain HTTP. */
    pic?: string;
    /** The short biography. */
    desc?: string;
    /** The longer biography, as XML wrapping the text. */
    wiki?: string;
    foreignName?: string;
  };
}

/** GET /singer/songs: a singer's songs, most played first, at most 30 per request. */
export interface QqSingerSongsResponseDto {
  code: 200;
  songs: QqTrackDto[];
  total?: number;
  more: boolean;
}

export interface QqSingerAlbumDto {
  albumMid: string;
  albumName: string;
  /** Release date as `YYYY-MM-DD`. */
  publishDate?: string;
  /** The kind of release, such as `Album` or `Single`. */
  albumType?: string;
}

/**
 * GET /getSingerAlbum, passed through under `response`. The `page` parameter is the number of
 * albums to skip, not a page number.
 */
export interface QqSingerAlbumsResponseDto {
  response: {
    code: number;
    singer?: {
      code: number;
      data?: {
        albumList?: QqSingerAlbumDto[];
        total?: number;
      };
    };
  };
}

/** GET /getSingerHotsong, passed through under `response`; read here for the fan count only. */
export interface QqSingerHotSongsResponseDto {
  response: {
    code: number;
    singer?: {
      code: number;
      data?: {
        singer_info?: { fans?: number };
      };
    };
  };
}

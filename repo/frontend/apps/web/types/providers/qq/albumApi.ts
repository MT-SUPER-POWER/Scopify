/** A song of GET /getAlbumInfo, which still uses the legacy field names. */
export interface QqAlbumSongDto {
  songid: number;
  songmid: string;
  songname: string;
  /** Length in seconds. */
  interval: number;
  singer: { id: number; mid: string; name: string }[];
  albumid?: number;
  albummid?: string;
  albumname?: string;
}

/** The fields read from `response.data` of GET /getAlbumInfo. */
export interface QqAlbumDetailDto {
  mid: string;
  name: string;
  /** Release date as `YYYY-MM-DD`. */
  aDate?: string;
  desc?: string;
  company?: string;
  genre?: string;
  singermid?: string;
  singername?: string;
  total_song_num?: number;
  list?: QqAlbumSongDto[];
}

/**
 * GET /getAlbumInfo, passed through under `response`. `code` is 0 on success and 1101 for an
 * album that does not exist.
 */
export interface QqAlbumDetailResponseDto {
  response: {
    code: number;
    subcode?: number;
    message?: string;
    data?: QqAlbumDetailDto;
  };
}

/** POST /user/album/subscribe, which changes the saved state of an album of the session. */
export interface QqAlbumSubscribeDto {
  code: number;
}

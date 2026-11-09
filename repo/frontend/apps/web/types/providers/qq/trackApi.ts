/** Fields consumed from modern `track_info` (/song/batch), not legacy songmid/songname. */
export interface QqTrackDto {
  id: number;
  mid: string;
  name: string;
  interval: number;
  singer: { id: number; mid: string; name: string }[];
  album: { id: number; mid: string; name: string };
  /** The song's MV; `vid` is empty when it has none. */
  mv?: { vid?: string };
  /** Present on songs the backend reads in full (not on every list). */
  pay?: { pay_play?: number };
  file?: {
    size_flac?: number;
    size_hires?: number;
    size_dolby?: number;
    size_360ra?: unknown[];
  };
}

/** One entry of POST /song/batch, in request order; failed entries carry their own code. */
export type QqSongBatchEntry =
  | { index: number; code: 200; song: QqTrackDto; info: Record<string, unknown> }
  | { index: number; code: number; kind?: string; message?: string };

/** POST /song/batch response; at most 20 songs per request. */
export interface QqSongBatchDto {
  code: 200;
  results: QqSongBatchEntry[];
  partial: boolean;
}

/** GET /song/fav-count?ids=…: one entry per requested ID. `count` is null when not reported. */
export interface QqFavCountDto {
  code: 200;
  items: { id: number; count: number | null; display: string | null }[];
}

/** GET /song/labels?id=…: tags the platform shows on a song. */
export interface QqSongLabelsDto {
  code: 200;
  id: number;
  labels: { text: string }[];
}

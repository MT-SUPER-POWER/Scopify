/**
 * GET /getLyric?songmid=...&trans=1. A legacy route, so the payload sits under `response`.
 * `lyric` is already decoded LRC; `trans` stays the upstream base64 of a UTF-8 LRC and is
 * empty for songs without a translation. The route serves no romanization or word timing.
 */
export interface QqLyricDto {
  response: {
    retcode?: number;
    code: number;
    subcode?: number;
    lyric?: string | null;
    trans?: string | null;
  };
}

import type { SongDetail } from "@/types/song/api";

/** Minimal projection of the existing NetEase song response; not a second song model. */
export type NeteaseTrackDto = Pick<SongDetail, "id" | "name" | "dt" | "ar" | "al">;

/** GET /song/detail; `songs` can be missing when no ID resolves. */
export interface NeteaseSongDetailDto {
  code: number;
  songs?: NeteaseTrackDto[];
}

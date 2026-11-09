import type { MusicTrack } from "@scopify/music-domain/track";

import type { SongDetail } from "@/types/song/api";

/**
 * NetEase song fields with no neutral counterpart. They travel with a NetEase track (the VIP
 * badge, quality cap, voice programs, MV, stats) and only NetEase modules read them.
 */
export type NeteaseTrackExtras = Partial<
  Pick<
    SongDetail,
    | "alia"
    | "commentCount"
    | "fee"
    | "likedCount"
    | "mv"
    | "pc"
    | "privilege"
    | "publishTime"
    | "voiceId"
  >
>;

/** Projection of the existing NetEase song response; not a second song model. */
export type NeteaseTrackDto = Pick<SongDetail, "id" | "name" | "dt" | "ar" | "al"> &
  NeteaseTrackExtras;

/** A NetEase song as an interface track, with its NetEase-only fields kept beside it. */
export type NeteaseMusicTrack = MusicTrack & { readonly netease: NeteaseTrackExtras };

/** GET /song/detail; `songs` can be missing when no ID resolves. */
export interface NeteaseSongDetailDto {
  code: number;
  songs?: NeteaseTrackDto[];
}

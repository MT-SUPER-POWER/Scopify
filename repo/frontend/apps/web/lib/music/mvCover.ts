import type { MvSummary } from "@/types/mv/api";

/** 不同 MV 接口的封面字段不一致，优先取 16:9 的版本。 */
export function getMvCover(mv: MvSummary) {
  return mv.imgurl16v9 || mv.cover || mv.imgurl || mv.picUrl || "";
}

/** MV 的艺人展示名：优先完整艺人列表，其次 artistName。 */
export function getMvArtistNames(mv: MvSummary) {
  return mv.artists?.length
    ? mv.artists.map((artist) => artist.name).join(" / ")
    : (mv.artistName ?? "");
}

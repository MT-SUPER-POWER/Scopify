import { pruneSongDetail } from "@/types/song/api";
import type { UserRecordResponse } from "@/types/user/api";
import type { ListeningRank, ListeningRankPeriod } from "@/types/user/profile";

const RANK_SIZE = 10;

/** code -2 表示对方未公开听歌排行；其余非 200 或结构异常视为请求失败。 */
export function toListeningRank(
  response: UserRecordResponse,
  period: ListeningRankPeriod,
): ListeningRank {
  if (response.code === -2) return { restricted: true, songs: [] };
  const entries = period === "week" ? response.weekData : response.allData;
  if (response.code !== 200 || !Array.isArray(entries)) {
    throw new Error("Invalid listening record response");
  }
  return {
    restricted: false,
    songs: entries
      .flatMap((entry) => (entry.song ? [pruneSongDetail(entry.song)] : []))
      .slice(0, RANK_SIZE),
  };
}

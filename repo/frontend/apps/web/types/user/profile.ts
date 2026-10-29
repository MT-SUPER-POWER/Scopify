import type { NeteaseUser } from "@/types/user/api";
import type { SongDetail } from "@/types/song/api";

// 直接复用 store 里已有的 NeteaseUser，不重复定义用户字段
export type { NeteaseUser };

export type ListeningRankPeriod = "week" | "all";

export interface ListeningRank {
  /** 对方关闭了听歌排行可见性 */
  restricted: boolean;
  songs: SongDetail[];
}

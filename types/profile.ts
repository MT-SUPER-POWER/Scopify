import type { NeteaseUser } from "@/types/api/user";

// 直接复用 store 里已有的 NeteaseUser，不重复定义用户字段
export type { NeteaseUser };

export interface UserPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
  creator?: { nickname: string; userId: number };
}

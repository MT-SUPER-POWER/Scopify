import type { NeteaseUser } from "@/types/api/user";

// 直接复用 store 里已有的 NeteaseUser，不重复定义用户字段
export type { NeteaseUser };

export interface UserPlaylist {
  coverImgUrl: string;
  creator?: { nickname: string; userId: number };
  href?: string;
  id: number;
  isVirtual?: boolean;
  lastSong?: {
    artists?: string;
    id?: number;
    name?: string;
  };
  name: string;
  playCount: number;
  playTime?: number;
  terminal?: {
    os?: string;
    osText?: string;
  };
  trackCount: number;
}

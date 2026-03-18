export interface NeteasePlaylist {
  id: number;
  name: string;
  createTime: number;
  coverImgUrl: string;
  description: string;
  trackCount: number;
  playCount: number;
  privacy: 0 | 10; // 0: 公开, 10: 私密
  subscribed: boolean;
  subscribedCount: number;
  tags: string[];
  creator: {
    nickname: string;
    avatarUrl: string;
  };
}

export const prunePlaylist = (raw: any): NeteasePlaylist => {
  if (!raw) return {} as NeteasePlaylist;

  return {
    id: raw.id,
    name: raw.name || "",
    createTime: raw.createTime || 0,
    coverImgUrl: raw.coverImgUrl || raw.picUrl || "", // 兼容网易云不同接口的命名习惯
    description: raw.description || "",
    trackCount: raw.trackCount || 0,
    playCount: raw.playCount || 0,
    privacy: raw.privacy || 0,
    subscribed: Boolean(raw.subscribed),
    subscribedCount: raw.subscribedCount || 0,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    creator: {
      nickname: raw.creator?.nickname || "未知用户",
      avatarUrl: raw.creator?.avatarUrl || "",
    },
  };
};

export interface RecommendPlaylist {
  id: number;
  name: string;
  picUrl: string;
  playCount: number;
  trackCount: number;
  copywriter: string;   //  推荐理由文案
}

export const pruneRecommendPlaylist = (raw: any): RecommendPlaylist => {
  if (!raw) return {} as RecommendPlaylist;

  return {
    id: raw.id,
    name: raw.name || "",
    picUrl: raw.picUrl || "",
    playCount: raw.playCount || 0,
    trackCount: raw.trackCount || 0,
    copywriter: raw.copywriter || ""
  };
};

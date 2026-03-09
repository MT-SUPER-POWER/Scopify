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

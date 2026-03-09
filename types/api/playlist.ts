export interface NeteasePlaylist {
  id: number;           // playlist 的唯一 ID
  name: string;
  tags: string[];
  coverImgUrl: string;
  trackCount: number;     // 一共多少歌曲
  subscribed: boolean;
  creator: {
    nickname: string;
    avatarUrl: string;
  };
}

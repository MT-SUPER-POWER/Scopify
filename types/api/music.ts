export interface SongDetail {
  id: number;
  name: string;
  dt: number; // 时长 (ms)
  ar: Array<{ id: number; name: string }>; // 歌手
  al: {
    id: number;
    name: string;
    picUrl: string;
  }; // 专辑
  publishTime: number;
}


interface NeteaseUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
}

interface NeteaseReply {
  user: NeteaseUser;
  content: string;
}

export interface NeteaseComment {
  commentId: number;
  user: NeteaseUser;
  content: string;
  timeStr: string;
  likedCount: number;
  liked: boolean;
  beReplied: NeteaseReply[];
}

export interface SongComment {
  code: number;
  total: number;
  more: boolean;
  moreHot: boolean;
  hotComments?: NeteaseComment[];
  comments: NeteaseComment[];
}

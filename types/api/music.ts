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


// 歌词行格式
interface LyricLine {
  version: number;
  lyric: string;
}

// 用户信息（歌词贡献者）
interface LyricUser {
  id: number;
  status: number;
  demand: number;
  userid: number;
  nickname: string;
  uptime: number;
}

// 歌词 API 响应
export interface NeteaseLyric {
  sgc: boolean;
  sfy: boolean;
  qfy: boolean;
  transUser?: LyricUser;   // 翻译者
  lyricUser?: LyricUser;   // 原词作者
  lrc: LyricLine;          // 原文歌词（LRC 格式）
  klyric: LyricLine;       // 逐字歌词（卡拉OK）
  tlyric: LyricLine;       // 翻译歌词
  romalrc: LyricLine;      // 罗马音歌词
  yrc: LyricLine;          // 逐字原文歌词（YRC 格式）
  ytlrc: LyricLine;        // 逐字翻译歌词
  yromalrc: LyricLine;     // 逐字罗马音歌词
}

import { NeteaseUser } from "./user";

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

export interface RawSongDetail extends SongDetail {
  [key: string]: unknown; // 允许包含任意其他属性
}

/**
 * 清洗歌曲详情数据
 * @param raw 原始 API 返回的歌曲对象
 */
export const pruneSongDetail = (raw: RawSongDetail): SongDetail => {
  // 1. 如果传入空数据，直接返回一个类型安全的空结构兜底
  if (!raw) {
    return {
      id: 0,
      name: "未知歌曲",
      dt: 0,
      ar: [],
      al: { id: 0, name: "", picUrl: "" },
      publishTime: 0,
    };
  }

  return {
    id: raw.id || 0,
    name: raw.name || "未知歌曲",
    dt: raw.dt || 0,

    // 2. 确保 ar 一定是数组，且内部的对象属性绝对安全
    ar: Array.isArray(raw.ar)
      ? raw.ar.map((artist: any) => ({
        id: artist?.id || 0,
        name: artist?.name || "未知歌手",
      }))
      : [],

    // 3. 使用可选链 (?.) 防止 raw.al 为 null 时取属性崩溃
    al: {
      id: raw.al?.id || 0,
      name: raw.al?.name || "未知专辑",
      picUrl: raw.al?.picUrl || raw.al?.blurPicUrl || raw.al?.coverUrl || "",
    },

    publishTime: raw.publishTime || 0,
  };
};


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
  sgc?: boolean;             // 歌词是否由系统自动生成（非人工上传）
  sfy?: boolean;             // 歌词是否与歌曲匹配/适配
  qfy?: boolean;             // 歌词质量是否达标
  transUser?: LyricUser;   // 翻译者
  lyricUser?: LyricUser;   // 原词作者
  lrc?: LyricLine;          // 原文歌词（LRC 格式）
  klyric?: LyricLine;       // 逐字歌词（卡拉OK）
  tlyric?: LyricLine;       // 翻译歌词
  romalrc?: LyricLine;      // 罗马音歌词
  yrc?: LyricLine;          // 逐字原文歌词（YRC 格式）
  ytlrc?: LyricLine;        // 逐字翻译歌词
  yromalrc?: LyricLine;     // 逐字罗马音歌词
}


export function pruneNeteaseLyric(raw: any): NeteaseLyric {
  return {
    lrc: raw.lrc?.lyric || "",
    yrc: raw.yrc?.lyric || "",
  }
}

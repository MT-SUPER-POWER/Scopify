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
    blurPicUrl?: string;
    coverUrl?: string;
  }; // 专辑
  publishTime: number;
  pc?: {
    privateCloud?: unknown;
  }
}

export interface RawSongDetail extends SongDetail {
  [key: string]: unknown; // 允许包含任意其他属性
}

/**
 * 清洗歌曲详情数据
 * 兼容标准格式 (ar/al) 和后端异常格式 (artists/album)
 * @param raw 原始 API 返回的歌曲对象
 */
export const pruneSongDetail = (raw: any): SongDetail => {
  // 1. 如果传入空数据，直接返回一个类型安全的空结构兜底
  if (!raw) {
    return {
      id: 0,
      name: "Unknown Song",
      dt: 0,
      ar: [],
      al: { id: 0, name: "", picUrl: "", blurPicUrl: "", coverUrl: "" },
      publishTime: 0,
    };
  }

  // 2. 处理歌手字段：优先用 ar，没有就用 artists
  const artistList = raw.ar || raw.artists || [];

  // 3. 处理专辑字段：优先用 al，没有就用 album
  const albumData = raw.al || raw.album || {};

  return {
    id: raw.id || 0,
    name: raw.name || "未知歌曲",
    dt: raw.dt || raw.duration || 0, // 有的接口用 duration

    // 4. 确保 ar 一定是数组，兼容两种字段名
    ar: Array.isArray(artistList)
      ? artistList.map((artist: any) => ({
        id: artist?.id || 0,
        name: artist?.name || "Unknown Artist",
      }))
      : [],

    // 5. 处理专辑，兼容两种字段名和各种图片字段
    al: {
      id: albumData?.id || 0,
      name: albumData?.name || "Unknown Album",
      // 图片优先级：picUrl > blurPicUrl > pic > 空
      picUrl: albumData?.picUrl || albumData?.blurPicUrl || albumData?.pic || "",
      blurPicUrl: albumData?.blurPicUrl,
      coverUrl: albumData?.coverUrl,
    },
    publishTime: raw.publishTime || albumData?.publishTime || 0,
    pc: raw.pc || {},
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

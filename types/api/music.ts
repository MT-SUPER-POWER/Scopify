import type { NeteaseUser } from "./user";

export interface SongUrlMatchResponse {
  code: number;
  data: string;
  proxyUrl: string;
}

export interface SongUrlMatchParams {
  cookie?: string;
  id: number | string;
  source?: string;
}

export interface SongStats {
  likedCount?: number;
  commentCount?: number;
}

export interface SongRedCountResponse {
  code: number;
  data?: {
    count?: number;
    likedCount?: number;
  };
}

export interface SongCommentTotalResponse {
  code: number;
  total?: number;
}

export interface SongDetail {
  id: number;
  name: string;
  dt: number; // 时长 (ms)
  fee: number;
  privilege?: SongPlaybackPrivilege;
  ar: { id: number; name: string }[]; // 歌手
  al: {
    id: number;
    name: string;
    picUrl: string;
    blurPicUrl?: string;
    coverUrl?: string;
  }; // 专辑
  publishTime: number;
  alia?: string[];
  likedCount?: number;
  commentCount?: number;
  pc?: {
    privateCloud?: NeteasePrivateCloud;
  };
}

export interface NeteasePrivateCloud {
  alicename?: string;
  bitRate?: number;
  fileSize?: number;
  id?: number;
  name?: string;
  simpleSongId?: number;
  songId?: number;
  version?: number;
}

/** `/playlist/track/all` 中按歌曲 ID 返回的播放权限与最高可用音质。 */
export interface SongPlaybackPrivilege {
  id: number;
  fee?: number;
  maxBrLevel?: string;
  playMaxBrLevel?: string;
  plLevel?: string;
}

export interface RawSongArtist {
  id: number;
  img1v1Url?: string;
  name: string;
  picUrl?: string;
}

export interface RawSongAlbum {
  id: number;
  blurPicUrl?: string;
  coverUrl?: string;
  name: string;
  picUrl?: string;
  publishTime?: number;
}

/**
 * 原始歌曲对象会因端点不同使用 `ar`/`al` 或 `artists`/`album`。
 * 字段由 `/album` 与 `/v1/artist/songs` 的实际响应确认。
 */
export interface RawSongDetail {
  al?: RawSongAlbum;
  album?: RawSongAlbum;
  alia?: string[];
  ar?: RawSongArtist[];
  artists?: RawSongArtist[];
  commentCount?: number;
  dt?: number;
  duration?: number;
  fee?: number;
  id: number;
  info?: {
    commentThread?: {
      commentCount?: number;
    };
    likedCount?: number;
  };
  likedCount?: number;
  name: string;
  pc?: {
    privateCloud?: NeteasePrivateCloud;
  };
  privilege?: SongPlaybackPrivilege;
  publishTime?: number;
  redCount?: number;
}

/**
 * 清洗歌曲详情数据
 * 兼容标准格式 (ar/al) 和后端异常格式 (artists/album)
 * @param raw 原始 API 返回的歌曲对象
 */
export const pruneSongDetail = (raw: RawSongDetail): SongDetail => {
  const artistList = raw.ar ?? raw.artists ?? [];
  const albumData = raw.al ?? raw.album;

  const likedCount = raw.likedCount ?? raw.info?.likedCount ?? raw.redCount;
  const commentCount = raw.commentCount ?? raw.info?.commentThread?.commentCount;

  return {
    id: raw.id,
    name: raw.name,
    dt: raw.dt ?? raw.duration ?? 0,
    fee: raw.privilege?.fee ?? raw.fee ?? 0,

    // 4. 确保 ar 一定是数组，兼容两种字段名
    ar: Array.isArray(artistList)
      ? artistList.map((artist) => ({
          id: artist.id,
          name: artist.name,
        }))
      : [],

    // 5. 处理专辑，兼容两种字段名和各种图片字段
    al: {
      id: albumData?.id ?? 0,
      name: albumData?.name ?? "Unknown Album",
      // 图片优先级：picUrl > blurPicUrl > pic > 空
      picUrl: albumData?.picUrl ?? albumData?.blurPicUrl ?? "",
      blurPicUrl: albumData?.blurPicUrl,
      coverUrl: albumData?.coverUrl,
    },
    publishTime: raw.publishTime ?? albumData?.publishTime ?? 0,
    alia: Array.isArray(raw.alia) ? raw.alia.filter(Boolean) : [],
    ...(typeof likedCount === "number" && likedCount >= 0 ? { likedCount } : {}),
    ...(typeof commentCount === "number" && commentCount >= 0 ? { commentCount } : {}),
    pc: raw.pc ?? {},
    ...(raw.privilege ? { privilege: raw.privilege } : {}),
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

/** A lyric variant returned by NetEase's `/lyric/new` endpoint. */
export interface NeteaseLyricBranch {
  version: number;
  lyric: string | null;
  pureMusic?: boolean;
  [key: string]: unknown;
}

/** A NetEase user credited for a lyric or its translation. */
export interface NeteaseLyricUser {
  id: number;
  status: number;
  demand: number;
  userid: number;
  nickname: string;
  uptime: number;
  [key: string]: unknown;
}

/**
 * Raw response from NetEase's `/lyric/new` endpoint.
 *
 * Keep this object intact in state and cache. New fields are occasionally
 * introduced by the upstream API, so the index signature intentionally
 * preserves them until a presentation adapter chooses to consume them.
 */
export interface NeteaseLyric {
  sgc?: boolean; // 歌词是否由系统自动生成（非人工上传）
  sfy?: boolean; // 歌词是否与歌曲匹配/适配
  qfy?: boolean; // 歌词质量是否达标
  pureMusic?: boolean;
  transUser?: NeteaseLyricUser; // 翻译者
  lyricUser?: NeteaseLyricUser; // 原词作者
  lrc?: NeteaseLyricBranch; // 原文歌词（LRC 格式）
  klyric?: NeteaseLyricBranch; // 逐字歌词（卡拉OK）
  tlyric?: NeteaseLyricBranch; // 翻译歌词
  romalrc?: NeteaseLyricBranch; // 罗马音歌词
  yrc?: NeteaseLyricBranch; // 逐字原文歌词（YRC 格式）
  ytlrc?: NeteaseLyricBranch; // 逐字翻译歌词
  yromalrc?: NeteaseLyricBranch; // 逐字罗马音歌词
  code: number;
  [key: string]: unknown;
}

/**
 * @deprecated The player now stores raw lyric responses losslessly. Retained
 * for callers during the migration from the old LRC/YRC-only shape.
 */
export function pruneNeteaseLyric(raw: NeteaseLyric | null): NeteaseLyric | null {
  return raw;
}

/** 音质等级 (对应 /song/url/v1 的 level 参数) */
export type MusicQualityLevel =
  | "standard" // 标准 128kbps
  | "higher" // 较高 192kbps
  | "exhigh" // 极高 320kbps
  | "lossless" // 无损
  | "hires" // Hi-Res
  | "jyeffect" // 高清环绕声
  | "sky" // 沉浸环绕声
  | "dolby" // 杜比全景声
  | "jymaster"; // 超清母带

/** 歌曲各音质文件信息 */
export interface SongMusicDetailItem {
  br: number; // 比特率 Bit Rate
  size: number; // 文件大小
  vd: number; // Volume Delta
  sr: number; // 采样率 Sample Rate
}

export interface SongMusicDetailResponse {
  code: number;
  data: Record<string, SongMusicDetailItem>;
}

export interface SongUrlV1Item {
  accompany: null;
  auEff: number;
  id: number;
  url: string;
  br: number;
  beatType: number;
  canExtend: boolean;
  channelLayout: null | string;
  closedGain: number;
  closedPeak: number;
  code: number;
  effectTypes: null | number[];
  encodeType: string;
  expi: number;
  fee: number;
  flag: number;
  freeTimeTrialPrivilege: NeteaseFreeTimeTrialPrivilege;
  freeTrialInfo: NeteaseFreeTrialInfo | null;
  freeTrialPrivilege: NeteaseFreeTrialPrivilege;
  gain: number;
  immerseType: null | string;
  level: string;
  levelConfuse: null | string;
  md5: string;
  message: null | string;
  musicId: string;
  podcastCtrp: null;
  rightSource: number;
  sr: number;
  size: number;
  type: string;
  payed: number;
  time: number;
  uf: null;
  urlSource: number;
}

export interface NeteaseFreeTimeTrialPrivilege {
  remainTime: number;
  resConsumable: boolean;
  type: number;
  userConsumable: boolean;
}

export interface NeteaseFreeTrialInfo {
  algData?: {
    audioEffect: number;
    fragSource: string;
  };
  end: number;
  fragmentType: number;
  start: number;
}

export interface NeteaseFreeTrialPrivilege {
  cannotListenReason: number | null;
  freeLimitTagType: number | null;
  listenType: number | null;
  playReason: null | string;
  resConsumable: boolean;
  userConsumable: boolean;
}

export interface SongUrlV1Response {
  code: number;
  data: SongUrlV1Item[];
}

export interface CheckMusicResponse {
  success: boolean;
  message: string;
}

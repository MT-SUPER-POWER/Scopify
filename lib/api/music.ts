import type { SongUrlMatchResponse } from "@/types/api/music";
import request from "../web/request";

export async function greySongUrlMatch(
  id: number | string,
  source?: string,
): Promise<SongUrlMatchResponse> {
  const params: Record<string, any> = { id };
  if (source) params.source = source;

  const response = await request.get<SongUrlMatchResponse>("/song/url/match", { params });
  return response.data;
}

export async function getLyric(id: number | string) {
  return request.get("/lyric/new", { params: { id: id } });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 音质相关 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

/** UI 音质选项 -> API level 参数映射 */
export const UI_QUALITY_TO_LEVEL: Record<string, MusicQualityLevel> = {
  standard: "standard",
  high: "exhigh",
  lossless: "lossless",
  spatial: "hires",
};

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
  id: number;
  url: string;
  br: number;
  size: number;
  md5: string;
  code: number;
  expi: number;
  type: string;
  gain: number;
  fee: number;
  uf: null | any;
  payed: number;
  flag: number;
  canExtend: boolean;
  freeTrialInfo: null | any;
  level: string;
  encodeType: string;
  time: number;
}

export interface SongUrlV1Response {
  code: number;
  data: SongUrlV1Item[];
}

export interface CheckMusicResponse {
  success: boolean;
  message: string;
}

/**
 * 获取歌曲各个音质的文件信息
 * 与获取歌曲详情接口相比，多出高清环绕声、沉浸环绕声、超清母带等音质的信息
 * GET /song/music/detail?id={id}
 */
export async function getSongMusicDetail(id: number | string) {
  return request.get<SongMusicDetailResponse>("/song/music/detail", {
    params: { id },
  });
}

/**
 * 获取音乐 URL - 新版
 * GET /song/url/v1?id={id}&level={level}
 * @param id   音乐 id（可多个，用逗号隔开）
 * @param level 播放音质等级
 * @param unblock 是否使用歌曲解锁
 */
export async function getSongUrlV1(
  id: number | string,
  level: MusicQualityLevel = "exhigh",
  unblock: boolean = true,
) {
  return request.get<SongUrlV1Response>("/song/url/v1", {
    params: { id, level, unblock },
  });
}

/**
 * 音乐是否可用
 * GET /check/music?id={id}&br={br}
 */
export async function checkMusicAvailable(id: number | string, br?: number) {
  return request.get<CheckMusicResponse>("/check/music", {
    params: { id, ...(br ? { br } : {}) },
  });
}

/**
 * 带音质选择的歌曲 URL 获取
 * 先尝试 /song/url/v1 (新音质接口)，失败后降级到 /song/url/match (灰色歌曲解灰)
 */
export async function getSongUrlWithQuality(
  id: number | string,
  level: MusicQualityLevel = "exhigh",
) {
  try {
    const res = await getSongUrlV1(id, level);
    const item = res.data?.data?.[0];
    if (item?.url) {
      return { data: item.url, level, source: "url-v1" as const };
    }
    throw new Error("No URL returned from v1");
  } catch {
    // 降级到灰色歌曲链接
    const fallback = await greySongUrlMatch(id);
    return { data: fallback.data ?? fallback.proxyUrl, level, source: "url-match" as const };
  }
}

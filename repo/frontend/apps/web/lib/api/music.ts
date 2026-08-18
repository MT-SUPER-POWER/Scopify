import type {
  SongUrlMatchResponse,
  SongUrlMatchParams,
  MusicQualityLevel,
  SongMusicDetailResponse,
  SongUrlV1Response,
  CheckMusicResponse,
  NeteaseLyric,
  SongChorusResponse,
} from "@/types/api/music";
import request from "../web/request";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";

// 获取 cookie 的辅助函数
const getCookie = () => {
  return getMusicSessionCredential() ?? "";
};

export async function greySongUrlMatch(
  id: number | string,
  source?: string,
): Promise<SongUrlMatchResponse> {
  const params: SongUrlMatchParams = { id };
  if (source) params.source = source;
  const cookie = getCookie();
  if (cookie) params.cookie = cookie;

  const response = await request.get<SongUrlMatchResponse>("/song/url/match", {
    params,
  });
  return response.data;
}

export async function getLyric(id: number | string) {
  return request.get<NeteaseLyric>("/lyric/new", { params: { id } });
}

export async function getSongChorus(id: number | string, signal?: AbortSignal) {
  return request.get<SongChorusResponse>("/song/chorus", { params: { id }, signal });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 音质相关 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** UI 音质选项 -> API level 参数映射 */
export const UI_QUALITY_TO_LEVEL: Record<string, MusicQualityLevel> = {
  sky: "sky",
  jymaster: "jymaster",
  dolby: "dolby",
  spatial: "jyeffect",
  hires: "hires",
  lossless: "lossless",
  high: "exhigh",
  standard: "standard",
};

/**
 * 获取歌曲各个音质的文件信息
 * 与获取歌曲详情接口相比，多出高清环绕声、沉浸环绕声、超清母带等音质的信息
 * GET /song/music/detail?id={id}
 */
export async function getSongMusicDetail(id: number | string) {
  const cookie = getCookie();
  return request.get<SongMusicDetailResponse>("/song/music/detail", {
    params: { id, ...(cookie ? { cookie } : {}) },
  });
}

/**
 * 获取音乐 URL - 新版
 * GET /song/url/v1?id={id}&level={level}
 * @param id   音乐 id（可多个，用逗号隔开）
 * @param level 播放音质等级
 */
export async function getSongUrlV1(id: number | string, level: MusicQualityLevel = "exhigh") {
  const cookie = getCookie();
  return request.get<SongUrlV1Response>("/song/url/v1", {
    params: { id, level, ...(cookie ? { cookie } : {}) },
  });
}

/**
 * 音乐是否可用
 * GET /check/music?id={id}&br={br}
 */
export async function checkMusicAvailable(id: number | string, br?: number) {
  const cookie = getCookie();
  return request.get<CheckMusicResponse>("/check/music", {
    params: { id, ...(br ? { br } : {}), ...(cookie ? { cookie } : {}) },
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
      return {
        data: item.url,
        level,
        replayGainTrackGain: Number.isFinite(item.gain) ? item.gain : undefined,
        source: "url-v1" as const,
      };
    }
    throw new Error("No URL returned from v1");
  } catch {
    // 降级到灰色歌曲链接
    const fallback = await greySongUrlMatch(id);
    return {
      data: fallback.data ?? fallback.proxyUrl,
      level,
      replayGainTrackGain: undefined,
      source: "url-match" as const,
    };
  }
}

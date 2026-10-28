import type { SongDynamicCoverData } from "@/types/song/api";

const VIDEO_URL_KEYS = ["videoPlayUrl", "dynamicCoverVideoUrl", "playUrl"] as const;

/** 从动态封面接口的响应里取出可直接播放的视频地址；接口字段不稳定，按已知字段依次尝试。 */
export function resolveDynamicCoverVideoUrl(data: SongDynamicCoverData | null | undefined) {
  for (const key of VIDEO_URL_KEYS) {
    const value = data?.[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

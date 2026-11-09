import type { MusicMv } from "@scopify/music-domain/mv";

/** 保持平台给出的排序，排除当前视频及跨页重复项。 */
export function getRelatedMvs(items: readonly MusicMv[], currentId: string) {
  const seen = new Set([currentId]);
  return items.filter((item) => {
    if (seen.has(item.ref.id)) return false;
    seen.add(item.ref.id);
    return true;
  });
}

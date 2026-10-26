import type { MvSummary } from "@/types/api/mv";

export function getRelatedMvKeyword(mv: MvSummary) {
  const artist = mv.artists?.[0]?.name.trim() || mv.artistName?.trim();
  return [mv.name.trim(), artist].filter(Boolean).join(" ");
}

/** 保持搜索排序，排除当前视频及跨页重复项。 */
export function getRelatedMvs(items: readonly MvSummary[], currentId: number) {
  const seen = new Set([currentId]);
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

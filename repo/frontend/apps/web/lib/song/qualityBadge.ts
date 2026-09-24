import type { SongQualityBadgeLevel, SongQualityBadgeDefinition } from "@/types/songQuality";
export type {
  SongQualityBadgeLevel,
  SongQualityBadgeTone,
  SongQualityBadgeDefinition,
} from "@/types/songQuality";

const qualityBadges: Record<SongQualityBadgeLevel, SongQualityBadgeDefinition> = {
  jymaster: { level: "jymaster", tone: "gold" },
  vivid: { level: "vivid", tone: "gold" },
  dolby: { level: "dolby", tone: "gold" },
  sky: { level: "sky", tone: "gold" },
  jyeffect: { level: "jyeffect", tone: "gold" },
  hires: { level: "hires", tone: "red" },
  lossless: { level: "lossless", tone: "red" },
};

export function getSongQualityBadge(
  qualityLevel: null | string | undefined,
): SongQualityBadgeDefinition | null {
  if (!qualityLevel || !(qualityLevel in qualityBadges)) return null;
  return qualityBadges[qualityLevel as SongQualityBadgeLevel];
}

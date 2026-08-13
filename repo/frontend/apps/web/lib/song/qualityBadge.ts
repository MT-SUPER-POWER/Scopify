export type SongQualityBadgeLevel =
  "jymaster" | "dolby" | "sky" | "jyeffect" | "hires" | "lossless";

export type SongQualityBadgeTone = "gold" | "red";

export interface SongQualityBadgeDefinition {
  level: SongQualityBadgeLevel;
  tone: SongQualityBadgeTone;
}

const qualityBadges: Record<SongQualityBadgeLevel, SongQualityBadgeDefinition> = {
  jymaster: { level: "jymaster", tone: "gold" },
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

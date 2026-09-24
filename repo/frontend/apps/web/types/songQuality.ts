export type SongQualityBadgeLevel =
  "jymaster" | "dolby" | "vivid" | "sky" | "jyeffect" | "hires" | "lossless";
export type SongQualityBadgeTone = "gold" | "red";
export interface SongQualityBadgeDefinition {
  level: SongQualityBadgeLevel;
  tone: SongQualityBadgeTone;
}

export interface SongQualityBadgeProps {
  className?: string;
  qualityLevel: string | null | undefined;
}

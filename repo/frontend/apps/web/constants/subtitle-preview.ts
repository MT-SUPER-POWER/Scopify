import type { LyricsPreviewSettings } from "@/types/appearance";
import type { SubtitlePayload } from "@/types/subtitle-preview";

export const SUBTITLE_COLOR_PRESETS = [
  { id: "white", color: "#FFFFFF", gradientColor: "#FFFFFF", colorMode: "solid" },
  { id: "mint", color: "#E5FFE9", gradientColor: "#6DE8C1", colorMode: "gradient" },
  { id: "sunset", color: "#FFE8B5", gradientColor: "#FFA6BA", colorMode: "gradient" },
  { id: "ice", color: "#E8F7FF", gradientColor: "#A5B5FF", colorMode: "gradient" },
] as const satisfies readonly (Pick<
  LyricsPreviewSettings,
  "color" | "gradientColor" | "colorMode"
> & { id: string })[];

export const SUBTITLE_PREVIEW_SCENES: Record<
  "short" | "long" | "bilingual" | "chinese",
  SubtitlePayload
> = {
  short: { source: "Stay with me", target: "陪在我身边", isChinese: false },
  long: {
    source: "让音乐穿过漫长的夜晚，陪我们走过每一条熟悉的街道，把未说完的故事留给明天。",
    target: "Let the music carry our unfinished stories into tomorrow.",
    isChinese: true,
  },
  bilingual: {
    source: "Let the music stay with you",
    target: "让音乐，留在生活里",
    isChinese: false,
  },
  chinese: { source: "让音乐，留在生活里", target: "Let the music stay with you", isChinese: true },
};

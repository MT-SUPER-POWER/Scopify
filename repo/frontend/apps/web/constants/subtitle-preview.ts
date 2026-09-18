import { DEFAULT_LYRICS_PREVIEW } from "./appearance";
import { subtitlePalette } from "@/lib/settings/subtitlePalette";
import type { BuiltinSubtitlePalette } from "@/types/subtitle-preview";
import type { SubtitlePayload } from "@/types/subtitle-preview";

const basePalette = subtitlePalette(DEFAULT_LYRICS_PREVIEW);

export const SUBTITLE_COLOR_PRESETS = [
  { id: "builtin:white", label: "white", settings: { ...basePalette } },
  {
    id: "builtin:mint",
    label: "mint",
    settings: {
      ...basePalette,
      color: "#E5FFE9",
      gradientColor: "#6DE8C1",
      colorMode: "gradient",
      secondaryColor: "#CFEBDD",
      unsungColor: "#8EA69B",
    },
  },
  {
    id: "builtin:sunset",
    label: "sunset",
    settings: {
      ...basePalette,
      color: "#FFE8B5",
      gradientColor: "#FFA6BA",
      colorMode: "gradient",
      secondaryColor: "#F2D5CD",
      unsungColor: "#AA949B",
    },
  },
  {
    id: "builtin:ice",
    label: "ice",
    settings: {
      ...basePalette,
      color: "#E8F7FF",
      gradientColor: "#A5B5FF",
      colorMode: "gradient",
      secondaryColor: "#D4DFF5",
      unsungColor: "#929DB5",
    },
  },
] as const satisfies readonly BuiltinSubtitlePalette[];

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

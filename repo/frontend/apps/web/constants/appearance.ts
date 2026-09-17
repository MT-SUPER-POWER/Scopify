import type { BackgroundSettings, LyricsPreviewSettings, ThemeTimeSlot } from "@/types/appearance";

export const DEFAULT_THEME_SCHEDULE: ThemeTimeSlot[] = [
  { start: 0, themeId: "lavender" },
  { start: 420, themeId: "mist" },
  { start: 720, themeId: "silver" },
  { start: 1080, themeId: "sand" },
];

export const BACKGROUND_PRESETS = [
  { id: "silver", top: "#92999D", bottom: "#454B50" },
  { id: "mist", top: "#A3C9E6", bottom: "#485D70" },
  { id: "sage", top: "#BCCCB0", bottom: "#526A59" },
  { id: "sand", top: "#E0CCAC", bottom: "#78685C" },
  { id: "lavender", top: "#CDB8E4", bottom: "#625976" },
] as const;

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  preset: "silver",
  intensity: 70,
  height: 360,
  rotation: "fixed",
  customTop: "#A3C9E6",
  customBottom: "#625976",
};

export const DEFAULT_LYRICS_PREVIEW: LyricsPreviewSettings = {
  font: "sans",
  fontSize: 26,
  color: "#FFFFFF",
  backdropOpacity: 35,
  secondarySize: 15,
  secondaryColor: "#CFCFCF",
  showTranslation: false,
  autoCollapseChinese: true,
  maxWidth: 860,
  textAlign: "center",
  backgroundColor: "#0A0A0A",
  gradientColor: "#A3C9E6",
  colorMode: "solid",
  gradientAngle: 90,
  radius: 16,
  blur: 16,
  paddingX: 20,
  paddingY: 12,
  fontWeight: 600,
  textShadow: true,
  entrance: "fade",
  animationDuration: 200,
  characterInterval: 80,
  fillEnabled: true,
  unsungColor: "#9CA3AF",
  fillDuration: 5000,
  fillSoftness: 20,
};

export const LYRICS_PREVIEW_FONTS = {
  sans: '"Segoe UI", "Microsoft YaHei", sans-serif',
  serif: '"Noto Serif SC", "Songti SC", SimSun, serif',
  mono: '"Cascadia Code", "Microsoft YaHei", monospace',
} as const;

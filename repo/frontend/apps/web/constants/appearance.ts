import type { BackgroundSettings, LyricsPreviewSettings } from "@/types/appearance";

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
};

export const LYRICS_PREVIEW_FONTS = {
  sans: '"Segoe UI", "Microsoft YaHei", sans-serif',
  serif: '"Noto Serif SC", "Songti SC", SimSun, serif',
  mono: '"Cascadia Code", "Microsoft YaHei", monospace',
} as const;

import type { Theme } from "../../types";

// src/components/visualizer/themePresets.ts
// Built-in color theme presets for the visualizer stage.

export interface ThemePreset {
  id: string;
  labelKey: string;
  colors: Pick<Theme, "backgroundColor" | "primaryColor" | "accentColor" | "secondaryColor">;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "midnight",
    labelKey: "preset.midnight",
    colors: {
      accentColor: "#f4f4f5",
      backgroundColor: "#09090b",
      primaryColor: "#f4f4f5",
      secondaryColor: "#71717a",
    },
  },
  {
    id: "snow",
    labelKey: "preset.snow",
    colors: {
      accentColor: "#ea580c",
      backgroundColor: "#f5f5f4",
      primaryColor: "#1c1917",
      secondaryColor: "#44403c",
    },
  },
  {
    id: "ocean",
    labelKey: "preset.ocean",
    colors: {
      accentColor: "#38bdf8",
      backgroundColor: "#0a1628",
      primaryColor: "#e0f2fe",
      secondaryColor: "#7dd3fc",
    },
  },
  {
    id: "forest",
    labelKey: "preset.forest",
    colors: {
      accentColor: "#22c55e",
      backgroundColor: "#052e16",
      primaryColor: "#dcfce7",
      secondaryColor: "#86efac",
    },
  },
  {
    id: "rose",
    labelKey: "preset.rose",
    colors: {
      accentColor: "#f472b6",
      backgroundColor: "#1c0a13",
      primaryColor: "#fce7f3",
      secondaryColor: "#f9a8d4",
    },
  },
  {
    id: "lavender",
    labelKey: "preset.lavender",
    colors: {
      accentColor: "#a78bfa",
      backgroundColor: "#1a0f2e",
      primaryColor: "#ede9fe",
      secondaryColor: "#c4b5fd",
    },
  },
  {
    id: "amber",
    labelKey: "preset.amber",
    colors: {
      accentColor: "#f59e0b",
      backgroundColor: "#1c1407",
      primaryColor: "#fef3c7",
      secondaryColor: "#fcd34d",
    },
  },
  {
    id: "dusk",
    labelKey: "preset.dusk",
    colors: {
      accentColor: "#818cf8",
      backgroundColor: "#1e1b2e",
      primaryColor: "#e2e8f0",
      secondaryColor: "#a5b4fc",
    },
  },
];

const PRESET_MAP = new Map(THEME_PRESETS.map((p) => [p.id, p]));

export const DEFAULT_THEME_PRESET_ID = "midnight";

export function getThemePresetById(id: string): ThemePreset {
  return PRESET_MAP.get(id) ?? PRESET_MAP.get(DEFAULT_THEME_PRESET_ID)!;
}

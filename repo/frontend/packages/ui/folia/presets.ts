import type { FoliaThemeColors } from "./types";

export type FoliaThemePresetLabelKey =
  | "folia.preset.amber"
  | "folia.preset.dusk"
  | "folia.preset.forest"
  | "folia.preset.lavender"
  | "folia.preset.midnight"
  | "folia.preset.ocean"
  | "folia.preset.rose"
  | "folia.preset.snow";

export interface FoliaThemePreset {
  colors: FoliaThemeColors;
  id: string;
  labelKey: FoliaThemePresetLabelKey;
}

export const THEME_PRESETS: readonly FoliaThemePreset[] = [
  {
    id: "midnight",
    labelKey: "folia.preset.midnight",
    colors: {
      accentColor: "#f4f4f5",
      backgroundColor: "#09090b",
      primaryColor: "#f4f4f5",
      secondaryColor: "#71717a",
    },
  },
  {
    id: "snow",
    labelKey: "folia.preset.snow",
    colors: {
      accentColor: "#ea580c",
      backgroundColor: "#f5f5f4",
      primaryColor: "#1c1917",
      secondaryColor: "#44403c",
    },
  },
  {
    id: "ocean",
    labelKey: "folia.preset.ocean",
    colors: {
      accentColor: "#38bdf8",
      backgroundColor: "#0a1628",
      primaryColor: "#e0f2fe",
      secondaryColor: "#7dd3fc",
    },
  },
  {
    id: "forest",
    labelKey: "folia.preset.forest",
    colors: {
      accentColor: "#22c55e",
      backgroundColor: "#052e16",
      primaryColor: "#dcfce7",
      secondaryColor: "#86efac",
    },
  },
  {
    id: "rose",
    labelKey: "folia.preset.rose",
    colors: {
      accentColor: "#f472b6",
      backgroundColor: "#1c0a13",
      primaryColor: "#fce7f3",
      secondaryColor: "#f9a8d4",
    },
  },
  {
    id: "lavender",
    labelKey: "folia.preset.lavender",
    colors: {
      accentColor: "#a78bfa",
      backgroundColor: "#1a0f2e",
      primaryColor: "#ede9fe",
      secondaryColor: "#c4b5fd",
    },
  },
  {
    id: "amber",
    labelKey: "folia.preset.amber",
    colors: {
      accentColor: "#f59e0b",
      backgroundColor: "#1c1407",
      primaryColor: "#fef3c7",
      secondaryColor: "#fcd34d",
    },
  },
  {
    id: "dusk",
    labelKey: "folia.preset.dusk",
    colors: {
      accentColor: "#818cf8",
      backgroundColor: "#1e1b2e",
      primaryColor: "#e2e8f0",
      secondaryColor: "#a5b4fc",
    },
  },
];

export const DEFAULT_THEME_PRESET_ID = "midnight";

const PRESET_MAP = new Map<string, FoliaThemePreset>(
  THEME_PRESETS.map((preset) => [preset.id, preset]),
);

export function getThemePresetById(id: string): FoliaThemePreset {
  return PRESET_MAP.get(id) ?? PRESET_MAP.get(DEFAULT_THEME_PRESET_ID)!;
}

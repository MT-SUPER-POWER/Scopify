import type { FoliaStageTheme, FoliaThemeColors, FoliaThemeVariant } from "./types";

const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

const FALLBACK_COLORS: FoliaThemeColors = {
  accentColor: "#f4f4f5",
  backgroundColor: "#09090b",
  primaryColor: "#f4f4f5",
  secondaryColor: "#71717a",
};

export const DEFAULT_FOLIA_STAGE_THEME_ID = "monochrome";

const BUILTIN_STAGE_THEMES: readonly FoliaStageTheme[] = [
  {
    dark: FALLBACK_COLORS,
    id: DEFAULT_FOLIA_STAGE_THEME_ID,
    light: {
      accentColor: "#ea580c",
      backgroundColor: "#f5f5f4",
      primaryColor: "#1c1917",
      secondaryColor: "#44403c",
    },
    name: "墨白",
  },
  {
    dark: {
      accentColor: "#38bdf8",
      backgroundColor: "#0a1628",
      primaryColor: "#e0f2fe",
      secondaryColor: "#7dd3fc",
    },
    id: "ocean",
    light: {
      accentColor: "#0369a1",
      backgroundColor: "#f0f9ff",
      primaryColor: "#0c4a6e",
      secondaryColor: "#075985",
    },
    name: "深海",
  },
  {
    dark: {
      accentColor: "#22c55e",
      backgroundColor: "#052e16",
      primaryColor: "#dcfce7",
      secondaryColor: "#86efac",
    },
    id: "forest",
    light: {
      accentColor: "#15803d",
      backgroundColor: "#f0fdf4",
      primaryColor: "#14532d",
      secondaryColor: "#166534",
    },
    name: "森林",
  },
  {
    dark: {
      accentColor: "#f472b6",
      backgroundColor: "#1c0a13",
      primaryColor: "#fce7f3",
      secondaryColor: "#f9a8d4",
    },
    id: "rose",
    light: {
      accentColor: "#db2777",
      backgroundColor: "#fff1f2",
      primaryColor: "#881337",
      secondaryColor: "#9d174d",
    },
    name: "玫瑰",
  },
  {
    dark: {
      accentColor: "#a78bfa",
      backgroundColor: "#1a0f2e",
      primaryColor: "#ede9fe",
      secondaryColor: "#c4b5fd",
    },
    id: "lavender",
    light: {
      accentColor: "#7c3aed",
      backgroundColor: "#f5f3ff",
      primaryColor: "#4c1d95",
      secondaryColor: "#5b21b6",
    },
    name: "薰衣草",
  },
  {
    dark: {
      accentColor: "#f59e0b",
      backgroundColor: "#1c1407",
      primaryColor: "#fef3c7",
      secondaryColor: "#fcd34d",
    },
    id: "amber",
    light: {
      accentColor: "#b45309",
      backgroundColor: "#fffbeb",
      primaryColor: "#78350f",
      secondaryColor: "#92400e",
    },
    name: "琥珀",
  },
  {
    dark: {
      accentColor: "#818cf8",
      backgroundColor: "#1e1b2e",
      primaryColor: "#e2e8f0",
      secondaryColor: "#a5b4fc",
    },
    id: "dusk",
    light: {
      accentColor: "#4f46e5",
      backgroundColor: "#eef2ff",
      primaryColor: "#312e81",
      secondaryColor: "#4338ca",
    },
    name: "暮色",
  },
  {
    dark: {
      accentColor: "#fc8875",
      backgroundColor: "#442524",
      primaryColor: "#f8fafc",
      secondaryColor: "#fcc3b6",
    },
    id: "sky",
    light: {
      accentColor: "#1d4ed8",
      backgroundColor: "#fee9e4",
      primaryColor: "#111827",
      secondaryColor: "#475569",
    },
    name: "天空",
  },
];

const BUILTIN_THEME_IDS = new Set(BUILTIN_STAGE_THEMES.map((theme) => theme.id));

export function createBuiltinFoliaStageThemes(): FoliaStageTheme[] {
  return BUILTIN_STAGE_THEMES.map((theme) => structuredClone(theme));
}

export function createFoliaStageThemeId() {
  return `theme-${crypto.randomUUID()}`;
}

export function createFoliaStageTheme(
  name: string,
  seed: FoliaStageTheme = createBuiltinFoliaStageThemes()[0],
): FoliaStageTheme {
  return {
    dark: structuredClone(seed.dark),
    id: createFoliaStageThemeId(),
    light: structuredClone(seed.light),
    name: name.trim() || "自定义主题",
  };
}

export function getBuiltinFoliaStageTheme(id: string) {
  const theme = BUILTIN_STAGE_THEMES.find((item) => item.id === id);
  return theme ? structuredClone(theme) : null;
}

export function getFoliaStageTheme(themes: FoliaStageTheme[], id: string): FoliaStageTheme {
  return themes.find((theme) => theme.id === id) ?? themes[0] ?? createBuiltinFoliaStageThemes()[0];
}

export function getFoliaThemeColors(theme: FoliaStageTheme, variant: FoliaThemeVariant) {
  return theme[variant];
}

export function isBuiltinFoliaStageTheme(id: string) {
  return BUILTIN_THEME_IDS.has(id);
}

export function normalizeFoliaStageTheme(
  candidate: unknown,
  fallback: FoliaStageTheme = createBuiltinFoliaStageThemes()[0],
): FoliaStageTheme {
  const source = isRecord(candidate) ? candidate : {};
  return {
    dark: normalizeFoliaThemeColors(source.dark, fallback.dark),
    id: typeof source.id === "string" && source.id.trim() ? source.id : fallback.id,
    light: normalizeFoliaThemeColors(source.light, fallback.light),
    name:
      typeof source.name === "string" && source.name.trim() ? source.name.trim() : fallback.name,
  };
}

export function normalizeFoliaStageThemes(candidate: unknown): FoliaStageTheme[] {
  if (!Array.isArray(candidate)) return createBuiltinFoliaStageThemes();

  const themes: FoliaStageTheme[] = [];
  const ids = new Set<string>();
  for (const item of candidate) {
    const fallback = createBuiltinFoliaStageThemes()[0];
    const theme = normalizeFoliaStageTheme(item, fallback);
    if (ids.has(theme.id)) continue;
    ids.add(theme.id);
    themes.push(theme);
  }
  return themes.length ? themes : createBuiltinFoliaStageThemes();
}

export function parseFoliaStageThemeJson(value: string) {
  try {
    const candidate: unknown = JSON.parse(value);
    if (
      !isRecord(candidate) ||
      !hasThemeColors(candidate.light) ||
      !hasThemeColors(candidate.dark)
    ) {
      return null;
    }
    return {
      ...normalizeFoliaStageTheme(candidate),
      id: createFoliaStageThemeId(),
    };
  } catch {
    return null;
  }
}

function normalizeFoliaThemeColors(
  candidate: unknown,
  fallback: FoliaThemeColors,
): FoliaThemeColors {
  const source = isRecord(candidate) ? candidate : {};
  return {
    accentColor: normalizeHexColor(source.accentColor, fallback.accentColor),
    backgroundColor: normalizeHexColor(source.backgroundColor, fallback.backgroundColor),
    primaryColor: normalizeHexColor(source.primaryColor, fallback.primaryColor),
    secondaryColor: normalizeHexColor(source.secondaryColor, fallback.secondaryColor),
  };
}

function hasThemeColors(value: unknown): value is FoliaThemeColors {
  if (!isRecord(value)) return false;
  return ["accentColor", "backgroundColor", "primaryColor", "secondaryColor"].every(
    (key) => typeof value[key] === "string" && HEX_COLOR_PATTERN.test(value[key]),
  );
}

function normalizeHexColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value)
    ? value.toLowerCase()
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

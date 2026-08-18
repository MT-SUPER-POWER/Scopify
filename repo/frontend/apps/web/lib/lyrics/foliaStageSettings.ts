import {
  DEFAULT_CADENZA_TUNING,
  DEFAULT_CAPPELLA_TUNING,
  DEFAULT_CLASSIC_TUNING,
  DEFAULT_CLADDAGH_TUNING,
  DEFAULT_DIORAMA_TUNING,
  DEFAULT_FUME_TUNING,
  DEFAULT_LATENT_BACKGROUND_TUNING,
  DEFAULT_MONET_BACKGROUND_TUNING,
  DEFAULT_MONET_TUNING,
  DEFAULT_NOMAND_BACKGROUND_TUNING,
  DEFAULT_SORA_BACKGROUND_TUNING,
  DEFAULT_PENDOLO_TUNING,
  DEFAULT_PARTITA_TUNING,
  DEFAULT_SONNET_TUNING,
  DEFAULT_TILT_TUNING,
} from "@/components/lyrics/folia/src/types";
import {
  createBuiltinFoliaStageThemes,
  createFoliaStageTheme,
  getFoliaStageTheme,
  normalizeFoliaStageThemes,
} from "@scopify/ui/folia";
import type { FoliaStageSettings } from "@/types/foliaStage";

const NUMERIC_RANGES = {
  "background.common.opacity": [0, 1],
  "background.latent.tuning.ditheringAudioSpeed": [0, 2],
  "background.latent.tuning.ditheringOpacity": [0, 1],
  "background.latent.tuning.ditheringSize": [0.5, 8],
  "background.latent.tuning.ditheringSpeed": [0, 2],
  "background.latent.tuning.meshAudioSpeed": [0, 2],
  "background.latent.tuning.meshDistortion": [0, 2],
  "background.latent.tuning.meshSpeed": [0, 2],
  "background.latent.tuning.meshSwirl": [0, 1],
  "background.latent.tuning.overlayOpacity": [0, 1],
  "background.monet.tuning.backgroundBlurPx": [0, 60],
  "background.monet.tuning.backgroundGrayscale": [0, 1],
  "background.monet.tuning.backgroundHalfPaneOffsetX": [-40, 40],
  "background.monet.tuning.backgroundOverlayOpacity": [0, 1],
  "background.monet.tuning.backgroundSaturation": [0, 2],
  "background.monet.tuning.backgroundWash": [0, 1],
  "background.nomand.tuning.colorSteps": [1, 7],
  "background.nomand.tuning.overlayOpacity": [0, 1],
  "background.nomand.tuning.size": [0.5, 20],
  "background.sora.tuning.accentRatio": [0, 1],
  "background.sora.tuning.audioSyncStrength": [0, 1],
  "background.sora.tuning.backgroundBrightness": [0.1, 1],
  "background.sora.tuning.starDensity": [0.35, 2],
  "background.sora.tuning.starSize": [0.2, 2.5],
  "background.sora.tuning.starSpeed": [0.2, 3],
  "background.sora.tuning.twinkleIntensity": [0, 1],
  fontScale: [0.85, 1.4],
  lyricOffsetMs: [-30_000, 30_000],
  subtitleFontScale: [0.85, 1.4],
  subtitleOverlayOpacity: [0.2, 1],
  "tunings.cadenza.beamIntensity": [0, 1.2],
  "tunings.cadenza.fontScale": [0.5, 2],
  "tunings.cadenza.glowIntensity": [0, 2],
  "tunings.cadenza.motionAmount": [0, 2],
  "tunings.cadenza.widthRatio": [0.3, 1],
  "tunings.classic.breathingFloatMultiplier": [0, 2],
  "tunings.classic.wordSpacing": [0, 2],
  "tunings.claddagh.ellipseTiltDeg": [0, 60],
  "tunings.claddagh.focusScaleRatio": [0, 1.5],
  "tunings.claddagh.letterSpacingOffset": [-5, 20],
  "tunings.claddagh.radiusScale": [0.5, 1.5],
  "tunings.diorama.audioReactivity": [0, 1.5],
  "tunings.diorama.backgroundParticleCircumference": [4, 48],
  "tunings.diorama.backgroundParticleRadial": [1, 4],
  "tunings.diorama.cameraSpeed": [0.55, 1.85],
  "tunings.diorama.glowIntensity": [0.1, 1.5],
  "tunings.diorama.gradientIntensity": [0.1, 1.5],
  "tunings.diorama.motionAmount": [0.4, 1.6],
  "tunings.diorama.particleDensity": [96, 1536],
  "tunings.diorama.particleGlowIntensity": [0.1, 1.5],
  "tunings.diorama.particleScale": [0.65, 1.6],
  "tunings.diorama.soulIntensity": [0.1, 1.5],
  "tunings.fume.backgroundObjectOpacity": [0, 1],
  "tunings.fume.cameraSpeed": [0.55, 1.85],
  "tunings.fume.glowIntensity": [0, 1.8],
  "tunings.fume.heroScale": [0.82, 1.32],
  "tunings.fume.textHoldRatio": [0, 1],
  "tunings.monet.fontScale": [0.7, 1.5],
  "tunings.monet.portraitOffsetX": [-150, 0],
  "tunings.partita.staggerMax": [0, 180],
  "tunings.partita.staggerMin": [0, 180],
  "tunings.sonnet.cameraIntensity": [0, 2],
  "tunings.sonnet.mgDensity": [0, 2],
  "tunings.sonnet.postProcessContrast": [0, 1],
  "tunings.sonnet.postProcessGrain": [0, 1],
  "tunings.sonnet.postProcessHalftone": [0, 1],
  "tunings.sonnet.postProcessLensDispersion": [0, 1],
  "tunings.sonnet.postProcessLensDistortion": [0, 2],
  "tunings.sonnet.postProcessRgbShift": [0, 1],
  "tunings.sonnet.postProcessVignette": [0, 2],
  "tunings.sonnet.textureResolution": [0.5, 4],
  "tunings.sonnet.typographyMotion": [0, 2],
  "tunings.tilt.splitProbability": [0, 1],
  "tunings.tilt.tiltStyleProbability": [0, 1],
  visualizerOpacity: [0.2, 1],
} as const satisfies Record<string, readonly [number, number]>;

const STRING_ENUMS = {
  animationIntensity: ["calm", "normal", "chaotic"],
  "background.latent.tuning.colorSource": ["cover-theme", "cover-only"],
  "background.latent.tuning.displayMode": ["dithering", "mesh", "both"],
  "background.mode": ["common", "monet", "nomand", "latent", "url", "sora"],
  "background.monet.tuning.backgroundLayout": ["full-overlay", "half-pane-gradient"],
  "background.monet.tuning.backgroundSource": ["cover-derived", "uploaded-global"],
  "background.monet.tuning.backgroundWashColorMode": ["theme", "custom"],
  "background.nomand.tuning.ditheringType": ["2x2", "4x4", "8x8"],
  "background.nomand.tuning.imageSource": ["cover-derived", "uploaded-global"],
  fontStyle: ["sans", "serif", "mono"],
  mode: [
    "cadenza",
    "cappella",
    "claddagh",
    "classic",
    "diorama",
    "fume",
    "monet",
    "partita",
    "pendolo",
    "sonnet",
    "tilt",
  ],
  subtitleContentMode: ["translation", "romanization", "none"],
  subtitleFontStyle: ["sans", "serif", "mono"],
  themeVariant: ["dark", "light"],
  "tunings.cappella.avatarSource": ["cover", "builtin", "color", "custom"],
  "tunings.cappella.emojiPackSource": ["builtin", "custom"],
  "tunings.diorama.geometryVisibility.mode": ["clouds", "corridor"],
  "tunings.fume.cameraTrackingMode": ["stepped", "smooth"],
  "tunings.monet.audioStyle": ["bar", "line"],
  "tunings.monet.portraitSource": ["cover", "custom"],
  "tunings.monet.portraitStyle": ["square", "rectangular"],
  "tunings.sonnet.outerFrameMode": ["none", "frame", "full"],
  "tunings.tilt.colorScheme": ["default", "swap", "accentAll", "primaryAll"],
} as const satisfies Record<string, readonly string[]>;

export function createDefaultFoliaStageSettings(): FoliaStageSettings {
  return {
    animationIntensity: "normal",
    background: {
      common: {
        disableGeometricBackground: false,
        disableVignette: false,
        opacity: 0.75,
        useCoverColorBg: false,
      },
      latent: { tuning: structuredClone(DEFAULT_LATENT_BACKGROUND_TUNING) },
      mode: "latent",
      monet: { tuning: structuredClone(DEFAULT_MONET_BACKGROUND_TUNING) },
      nomand: { tuning: structuredClone(DEFAULT_NOMAND_BACKGROUND_TUNING) },
      sora: { tuning: structuredClone(DEFAULT_SORA_BACKGROUND_TUNING) },
      url: { items: [], selectedId: null },
    },
    fontFamily: null,
    fontScale: 1,
    fontStyle: "sans",
    hideTranslationSubtitle: false,
    lyricOffsetMs: 0,
    mode: "classic",
    showSubtitleTranslation: true,
    sonnetPerformanceWarningDismissed: false,
    subtitleContentMode: "translation",
    subtitleFontFallbackFamilies: [],
    subtitleFontFamily: null,
    subtitleFontInheritsLyrics: true,
    subtitleFontScale: 1,
    subtitleFontStyle: "sans",
    subtitleOverlayBackground: true,
    subtitleOverlayOpacity: 0.6,
    themeId: "monochrome",
    themeRecentIds: [],
    themes: createBuiltinFoliaStageThemes(),
    themeVariant: "dark",
    tunings: {
      cadenza: structuredClone(DEFAULT_CADENZA_TUNING),
      cappella: structuredClone(DEFAULT_CAPPELLA_TUNING),
      classic: structuredClone(DEFAULT_CLASSIC_TUNING),
      claddagh: structuredClone(DEFAULT_CLADDAGH_TUNING),
      diorama: structuredClone(DEFAULT_DIORAMA_TUNING),
      fume: structuredClone(DEFAULT_FUME_TUNING),
      monet: structuredClone(DEFAULT_MONET_TUNING),
      partita: structuredClone(DEFAULT_PARTITA_TUNING),
      pendolo: structuredClone(DEFAULT_PENDOLO_TUNING),
      sonnet: structuredClone(DEFAULT_SONNET_TUNING),
      tilt: structuredClone(DEFAULT_TILT_TUNING),
    },
    visualizerOpacity: 1,
  };
}

export function normalizeFoliaStageSettings(
  candidate: unknown,
  fallback?: FoliaStageSettings,
): FoliaStageSettings {
  const defaults = createDefaultFoliaStageSettings();
  const normalizedFallback = fallback ? normalizeAgainstSchema(fallback, defaults, "") : defaults;
  const normalized = normalizeAgainstSchema(
    withThemeLibraryMigration(withLegacyAliases(candidate)),
    normalizedFallback,
    "",
  );
  normalized.themes = normalizeFoliaStageThemes(normalized.themes);
  if (!normalized.themes.some((theme) => theme.id === normalized.themeId)) {
    normalized.themeId = normalized.themes[0].id;
  }
  normalized.themeRecentIds = normalized.themeRecentIds
    .filter((id) => id !== normalized.themeId)
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .filter((id) => normalized.themes.some((theme) => theme.id === id))
    .slice(0, 4);

  const items = normalized.background.url?.items ?? [];
  const selectedId = normalized.background.url?.selectedId ?? null;
  if (selectedId !== null && !items.some((item) => item.id === selectedId)) {
    normalized.background.url = { items, selectedId: null };
  }

  const partita = normalized.tunings.partita;
  if (partita && partita.staggerMin > partita.staggerMax) {
    partita.staggerMin = partita.staggerMax;
  }

  return normalized;
}

export function selectFoliaStageSettings(state: FoliaStageSettings): FoliaStageSettings {
  return normalizeFoliaStageSettings(state);
}

function normalizeAgainstSchema(
  candidate: unknown,
  schema: FoliaStageSettings,
  path: "",
): FoliaStageSettings;
function normalizeAgainstSchema<T>(candidate: unknown, schema: T, path: string): T;
function normalizeAgainstSchema<T>(candidate: unknown, schema: T, path: string): T {
  if (
    path === "fontFamily" ||
    path === "subtitleFontFamily" ||
    path === "background.url.selectedId"
  ) {
    return (typeof candidate === "string" || candidate === null ? candidate : schema) as T;
  }

  if (path === "subtitleFontFallbackFamilies") {
    return (
      Array.isArray(candidate)
        ? candidate.filter((value): value is string => typeof value === "string")
        : schema
    ) as T;
  }

  if (path === "themeRecentIds") {
    return (
      Array.isArray(candidate)
        ? candidate.filter((value): value is string => typeof value === "string").slice(0, 4)
        : schema
    ) as T;
  }

  if (path === "background.url.items") {
    return (Array.isArray(candidate) ? candidate.flatMap(normalizeUrlBackgroundItem) : schema) as T;
  }

  if (typeof schema === "number") {
    if (typeof candidate !== "number" || !Number.isFinite(candidate)) return schema;
    const range = NUMERIC_RANGES[path as keyof typeof NUMERIC_RANGES];
    return (range ? Math.min(range[1], Math.max(range[0], candidate)) : candidate) as T;
  }

  if (typeof schema === "boolean") {
    return (typeof candidate === "boolean" ? candidate : schema) as T;
  }

  if (typeof schema === "string") {
    if (typeof candidate !== "string") return schema;
    const allowed = STRING_ENUMS[path as keyof typeof STRING_ENUMS];
    return (
      !allowed || (allowed as readonly string[]).includes(candidate) ? candidate : schema
    ) as T;
  }

  if (schema === null) {
    return (candidate === null ? candidate : schema) as T;
  }

  if (Array.isArray(schema)) {
    return (Array.isArray(candidate) ? candidate : schema) as T;
  }

  if (isRecord(schema)) {
    const source = isRecord(candidate) ? candidate : {};
    return Object.fromEntries(
      Object.entries(schema).map(([key, value]) => {
        const childPath = path ? `${path}.${key}` : key;
        return [key, normalizeAgainstSchema(source[key], value, childPath)];
      }),
    ) as T;
  }

  return schema;
}

function normalizeUrlBackgroundItem(candidate: unknown) {
  if (!isRecord(candidate)) return [];
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.note !== "string" ||
    typeof candidate.url !== "string"
  ) {
    return [];
  }
  return [{ id: candidate.id, note: candidate.note, url: candidate.url }];
}

function withLegacyAliases(candidate: unknown): unknown {
  if (!isRecord(candidate)) return candidate;
  const normalized =
    candidate.showSubtitleTranslation === undefined &&
    typeof candidate.showTranslation === "boolean"
      ? { ...candidate, showSubtitleTranslation: candidate.showTranslation }
      : candidate;
  if (normalized.subtitleContentMode !== undefined) return normalized;
  if (typeof normalized.showSubtitleTranslation !== "boolean") return normalized;
  return {
    ...normalized,
    subtitleContentMode: normalized.showSubtitleTranslation ? "translation" : "none",
  };
}

function withThemeLibraryMigration(candidate: unknown): unknown {
  if (!isRecord(candidate) || Array.isArray(candidate.themes)) return candidate;

  const legacyPresetId =
    typeof candidate.themePresetId === "string" ? candidate.themePresetId : "midnight";
  const themes = createBuiltinFoliaStageThemes();
  const isCustomTheme = legacyPresetId === "custom";

  if (isCustomTheme && isRecord(candidate.customThemeColors)) {
    const legacyTheme = createFoliaStageTheme("自定义主题");
    legacyTheme.dark = {
      accentColor:
        typeof candidate.customThemeColors.accentColor === "string"
          ? candidate.customThemeColors.accentColor
          : legacyTheme.dark.accentColor,
      backgroundColor:
        typeof candidate.customThemeColors.backgroundColor === "string"
          ? candidate.customThemeColors.backgroundColor
          : legacyTheme.dark.backgroundColor,
      primaryColor:
        typeof candidate.customThemeColors.primaryColor === "string"
          ? candidate.customThemeColors.primaryColor
          : legacyTheme.dark.primaryColor,
      secondaryColor:
        typeof candidate.customThemeColors.secondaryColor === "string"
          ? candidate.customThemeColors.secondaryColor
          : legacyTheme.dark.secondaryColor,
    };
    themes.push(legacyTheme);
    return { ...candidate, themeId: legacyTheme.id, themeVariant: "dark", themes };
  }

  const themeId =
    legacyPresetId === "midnight" || legacyPresetId === "snow" ? "monochrome" : legacyPresetId;
  const theme = getFoliaStageTheme(themes, themeId);
  return {
    ...candidate,
    themeId: theme.id,
    themeVariant: legacyPresetId === "snow" ? "light" : "dark",
    themes,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

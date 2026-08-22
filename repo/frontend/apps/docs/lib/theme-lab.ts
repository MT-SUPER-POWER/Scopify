import { SCOPIFY_THEME_TOKENS, SHADCN_THEME_TOKENS } from "@/constants/theme-lab";
import type {
  ThemeCssArtifact,
  ThemeDraft,
  ThemeLabScope,
  ThemeMode,
  ThemePreviewStyle,
  ThemeTokenDefinition,
  ThemeTokenValues,
} from "@/types/theme-lab";

export function normalizeThemeId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "custom-theme"
  );
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value * 255)));
}

function channelToHex(value: number): string {
  return clampChannel(value).toString(16).padStart(2, "0");
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

function parseAlpha(value?: string): string {
  if (!value) return "";
  const alpha = value.endsWith("%") ? Number.parseFloat(value) / 100 : Number.parseFloat(value);
  return channelToHex(alpha);
}

export function normalizeColorToHex(value: string): string {
  const color = value.trim().toLowerCase();
  const shortHex = color.match(/^#([0-9a-f]{3})([0-9a-f])?$/i);
  if (shortHex?.[1]) {
    const rgb = [...shortHex[1]].map((channel) => channel.repeat(2)).join("");
    const alpha = shortHex[2] ? shortHex[2].repeat(2) : "";
    return `#${rgb}${alpha}`;
  }
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color)) return color;

  const rgb = color.match(
    /^rgba?\(\s*([\d.]+)(%?)[ ,]+([\d.]+)(%?)[ ,]+([\d.]+)(%?)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/,
  );
  if (rgb) {
    const channels = [
      [rgb[1], rgb[2]],
      [rgb[3], rgb[4]],
      [rgb[5], rgb[6]],
    ].map(([channel, unit]) => {
      const number = Number.parseFloat(channel ?? "0");
      return unit === "%" ? number / 100 : number / 255;
    });
    return `#${channels.map(channelToHex).join("")}${parseAlpha(rgb[7])}`;
  }

  const oklch = color.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/,
  );
  if (!oklch) return value;

  const lightnessValue = Number.parseFloat(oklch[1] ?? "0");
  const lightness = oklch[2] === "%" ? lightnessValue / 100 : lightnessValue;
  const chroma = Number.parseFloat(oklch[3] ?? "0");
  const hue = (Number.parseFloat(oklch[4] ?? "0") * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

  return `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}${parseAlpha(oklch[5])}`;
}

function renderVariables(
  definitions: readonly ThemeTokenDefinition[],
  values: ThemeTokenValues,
  mode: ThemeMode,
): string {
  return definitions
    .filter((definition) => mode === "light" || !definition.shared)
    .map((definition) => `  ${definition.name}: ${values[definition.name]};`)
    .join("\n");
}

function renderProfile(
  themeId: string,
  draft: ThemeDraft,
  definitions: readonly ThemeTokenDefinition[],
  includeColorScheme: boolean,
): string {
  const lightScheme = includeColorScheme ? "  color-scheme: light;\n\n" : "";
  const darkScheme = includeColorScheme ? "  color-scheme: dark;\n\n" : "";
  return `[data-theme="${themeId}"] {\n${lightScheme}${renderVariables(definitions, draft.light, "light")}\n}\n\n[data-theme="${themeId}"].dark {\n${darkScheme}${renderVariables(definitions, draft.dark, "dark")}\n}\n`;
}

export function generateThemeArtifacts(
  scope: ThemeLabScope,
  draft: ThemeDraft,
  requestedThemeId: string,
): ThemeCssArtifact[] {
  const themeId = normalizeThemeId(requestedThemeId);
  const shadcnArtifact = {
    css: `/* Shadcn token profile. */\n${renderProfile(themeId, draft, SHADCN_THEME_TOKENS, true)}`,
    filename: `${themeId}.css`,
    label: `themes/shadcn/${themeId}.css`,
  };

  if (scope === "shadcn") return [shadcnArtifact];

  return [
    shadcnArtifact,
    {
      css: `/* Scopify extension token profile. */\n${renderProfile(themeId, draft, SCOPIFY_THEME_TOKENS, false)}`,
      filename: `${themeId}.css`,
      label: `themes/scopify/${themeId}.css`,
    },
  ];
}

export function readThemeProfile(
  themeId: string,
  definitions: readonly ThemeTokenDefinition[],
): ThemeDraft {
  const readMode = (mode: ThemeMode): ThemeTokenValues => {
    const probe = document.createElement("div");
    probe.dataset.theme = themeId;
    probe.classList.toggle("dark", mode === "dark");
    probe.setAttribute("aria-hidden", "true");
    Object.assign(probe.style, {
      inset: "0 auto auto 0",
      opacity: "0",
      pointerEvents: "none",
      position: "fixed",
    });
    document.body.append(probe);
    const computed = getComputedStyle(probe);
    const values = Object.fromEntries(
      definitions.map((definition) => {
        const value = computed.getPropertyValue(definition.name).trim();
        return [definition.name, definition.kind === "color" ? normalizeColorToHex(value) : value];
      }),
    ) as ThemeTokenValues;
    probe.remove();
    return values;
  };

  return { dark: readMode("dark"), light: readMode("light") };
}

export function createPreviewStyle(values: ThemeTokenValues, mode: ThemeMode): ThemePreviewStyle {
  return { ...values, colorScheme: mode };
}

export function downloadThemeArtifact(artifact: ThemeCssArtifact): void {
  const url = URL.createObjectURL(new Blob([artifact.css], { type: "text/css;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.download = artifact.filename;
  anchor.href = url;
  anchor.click();
  URL.revokeObjectURL(url);
}

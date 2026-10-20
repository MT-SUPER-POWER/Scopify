import { LANDING_BASE_COLOR } from "@/constants/marketing";
import type { LandingPalette } from "@/types/marketing";

const parseHex = (hex: string) => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const number = Number.parseInt(full, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255] as const;
};

const toHex = (channels: readonly number[]) =>
  `#${channels
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

export const mixHex = (from: string, to: string, amount: number) => {
  const a = parseHex(from);
  const b = parseHex(to);
  return toHex(a.map((channel, index) => channel + (b[index]! - channel) * amount));
};

/** 把调色板写成着色器需要的 0–1 RGB 序列（4 × vec3）。 */
export const writePaletteRgb = (palette: LandingPalette, target: Float32Array) => {
  palette.forEach((hex, colorIndex) => {
    parseHex(hex).forEach((channel, channelIndex) => {
      target[colorIndex * 3 + channelIndex] = channel / 255;
    });
  });
};

/** 用客户端主题的上下两色推出一套声场配色：下方色压暗做暗部，上方色做高光。 */
export const paletteFromTheme = (top: string, bottom: string): LandingPalette => [
  LANDING_BASE_COLOR,
  mixHex(LANDING_BASE_COLOR, bottom, 0.42),
  mixHex(LANDING_BASE_COLOR, bottom, 0.85),
  top,
];

/** 用一个主色推出一套声场配色：从底色往主色走，暗部只带一点颜色，高光就是主色。 */
export const paletteFromAccent = (accent: string): LandingPalette => [
  LANDING_BASE_COLOR,
  mixHex(LANDING_BASE_COLOR, accent, 0.16),
  mixHex(LANDING_BASE_COLOR, accent, 0.4),
  accent,
];

/** 与客户端 `backgroundGradient()` 相同的首页顶部渐变。 */
export const themeGradient = (top: string, bottom: string) =>
  `linear-gradient(180deg, ${top} 0%, ${bottom} 38%, transparent 100%)`;

import { numberWithin } from "../tuningRegistry";
import {
  DEFAULT_NEBBIA_TUNING,
  NEBBIA_APPEAR_STYLES,
  NEBBIA_FADE_STYLES,
  NEBBIA_LAYOUTS,
  NEBBIA_LIMITS,
  type NebbiaNumberKey,
  type NebbiaTuning,
} from "./types";

// src/components/visualizer/nebbia/nebbiaTuning.ts
// 雾笺 tuning 的归一化（上游放在 tuning.ts 里）：存档、导入、同步、设置面板都经 normalizeNebbiaTuning 补齐字段、
// 认不得的值回默认、数值夹进范围。独立成文件，设置的 store 才能读它而不碰注册表。

/** 一组开关：只留认得的、按固定顺序排，一个都没有就用默认。 */
const subsetOf = <T extends string>(choices: readonly T[], value: unknown, fallback: T[]): T[] => {
  const picked = Array.isArray(value) ? choices.filter((c) => value.includes(c)) : [];
  return picked.length ? picked : [...fallback];
};

/** 早期存的单选（appearMode / fadeMode）换成开关。 */
const LEGACY_APPEAR: Record<string, NebbiaTuning["appear"]> = {
  auto: ["write", "fade"],
  write: ["write"],
  fade: ["fade"],
};
const LEGACY_FADE: Record<string, NebbiaTuning["fade"]> = {
  fog: ["fog"],
  fingers: ["fingers"],
  mix: ["fog", "fingers"],
};

/** 存着的值、导入或同步来的值，读成一份完整合法的 tuning：缺的、类型不对的用默认，数值夹进范围。 */
export const normalizeNebbiaTuning = (stored: unknown): NebbiaTuning => {
  const values = (stored && typeof stored === "object" ? stored : {}) as Partial<
    Record<keyof NebbiaTuning | "appearMode" | "fadeMode", unknown>
  >;
  const base = DEFAULT_NEBBIA_TUNING;
  const numbers = Object.fromEntries(
    (Object.keys(NEBBIA_LIMITS) as NebbiaNumberKey[]).map((key) => [
      key,
      numberWithin(values[key], base[key], NEBBIA_LIMITS[key].min, NEBBIA_LIMITS[key].max),
    ]),
  ) as Pick<NebbiaTuning, NebbiaNumberKey>;
  const appear = values.appear ?? LEGACY_APPEAR[String(values.appearMode)];
  const fade = values.fade ?? LEGACY_FADE[String(values.fadeMode)];
  return {
    appear: subsetOf(NEBBIA_APPEAR_STYLES, appear, base.appear),
    fade: subsetOf(NEBBIA_FADE_STYLES, fade, base.fade),
    layouts: subsetOf(NEBBIA_LAYOUTS, values.layouts, base.layouts),
    credits: typeof values.credits === "boolean" ? values.credits : base.credits,
    ...numbers,
  };
};

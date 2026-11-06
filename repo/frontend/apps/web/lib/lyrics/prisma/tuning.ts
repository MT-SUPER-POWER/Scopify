import {
  DEFAULT_PRISMA_TUNING,
  PRISMA_LIMITS,
  type PrismaNumberKey,
  type PrismaTuning,
} from "@/types/lyrics/prisma/model";

/** Reads a stored, imported or synced value as a complete tuning, clamping every number. */
export const normalizePrismaTuning = (stored: unknown): PrismaTuning => {
  const values = (stored && typeof stored === "object" ? stored : {}) as Partial<
    Record<keyof PrismaTuning, unknown>
  >;
  const numbers = Object.fromEntries(
    (Object.keys(PRISMA_LIMITS) as PrismaNumberKey[]).map((key) => {
      const value = values[key];
      const { min, max } = PRISMA_LIMITS[key];
      return [
        key,
        typeof value === "number" && Number.isFinite(value)
          ? Math.min(max, Math.max(min, value))
          : DEFAULT_PRISMA_TUNING[key],
      ];
    }),
  ) as Pick<PrismaTuning, PrismaNumberKey>;
  return {
    ...numbers,
    showTitle:
      typeof values.showTitle === "boolean" ? values.showTitle : DEFAULT_PRISMA_TUNING.showTitle,
  };
};

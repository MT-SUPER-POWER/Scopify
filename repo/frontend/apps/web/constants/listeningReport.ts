export const LISTENING_REPORT_MONTH_NAMES = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
] as const;

export const LISTENING_REPORT_ORDERED_PERIOD_KEYS = [
  "early_morning",
  "morning",
  "noon",
  "afternoon",
  "night",
  "deep_night",
] as const;

export const LISTENING_REPORT_TIME_OF_DAY_META = {
  afternoon: { label: "下午", order: 3, timeRange: "14:00 - 18:00" },
  deep_night: { label: "深夜", order: 5, timeRange: "23:00 - 05:00" },
  early_morning: { label: "清晨", order: 0, timeRange: "05:00 - 09:00" },
  morning: { label: "早晨", order: 1, timeRange: "09:00 - 12:00" },
  night: { label: "夜晚", order: 4, timeRange: "18:00 - 23:00" },
  noon: { label: "中午", order: 2, timeRange: "12:00 - 14:00" },
} as const;

export const LISTENING_REPORT_PILLAR_HEIGHTS: Record<number, number> = {
  0: 0,
  1: 6,
  2: 13,
  3: 22,
  4: 34,
};

export const LISTENING_REPORT_PILLAR_COLORS: Record<
  number,
  { left: string; right: string; stroke: string; top: string }
> = {
  0: {
    left: "#1c1d22",
    right: "#16171a",
    stroke: "rgba(255, 255, 255, 0.08)",
    top: "#27282e",
  },
  1: {
    left: "#14532d",
    right: "#0f3d21",
    stroke: "rgba(34, 197, 94, 0.25)",
    top: "#166534",
  },
  2: {
    left: "#166534",
    right: "#14532d",
    stroke: "rgba(34, 197, 94, 0.35)",
    top: "#15803d",
  },
  3: {
    left: "#15803d",
    right: "#166534",
    stroke: "rgba(34, 197, 94, 0.5)",
    top: "#22c55e",
  },
  4: {
    left: "#16a34a",
    right: "#15803d",
    stroke: "rgba(74, 222, 128, 0.8)",
    top: "#4ade80",
  },
};

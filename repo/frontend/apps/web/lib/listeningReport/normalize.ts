const DURATION_FIELDS = [
  "totalTime",
  "listenTime",
  "duration",
  "durationSeconds",
  "totalSeconds",
  "time",
  "total",
  "listenDuration",
  "totalDuration",
  "totalListeningTime",
  "totalPlayTime",
  "playTime",
  "sumTime",
] as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDurationSeconds(value: unknown): number | null {
  let numValue = value;
  if (typeof numValue === "string") {
    const parsed = Number(numValue);
    if (Number.isFinite(parsed)) {
      numValue = parsed;
    }
  }

  if (typeof numValue !== "number" || !Number.isFinite(numValue) || numValue < 0) return null;

  // 听歌足迹接口通常以秒返回时长；若后端改为毫秒，则避免把很长的累计时长直接展示成天文数字。
  return Math.round(numValue > 2_000_000_000 ? numValue / 1_000 : numValue);
}

/** 从听歌足迹的差异化响应里提取以秒为单位的时长。 */
export function getListeningDurationSeconds(response: unknown): number | null {
  const candidates: unknown[] = [response];
  if (isRecord(response)) candidates.push(response.data, response.result);

  for (const candidate of candidates) {
    const directDuration = toDurationSeconds(candidate);
    if (directDuration !== null) return directDuration;
    if (!isRecord(candidate)) continue;

    for (const field of DURATION_FIELDS) {
      const duration = toDurationSeconds(candidate[field]);
      if (duration !== null) return duration;
    }
  }

  return null;
}

export function formatListeningDuration(seconds: number): string {
  const hours = Math.floor(Math.max(seconds, 0) / 3600);
  return `${hours.toLocaleString()} 小时`;
}

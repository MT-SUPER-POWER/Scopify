const DURATION_FIELDS = [
  "totalTime",
  "listenTime",
  "duration",
  "durationSeconds",
  "totalSeconds",
  "time",
  "total",
] as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDurationSeconds(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;

  // 听歌足迹接口通常以秒返回时长；若后端改为毫秒，则避免把很长的累计时长直接展示成天文数字。
  return Math.round(value > 2_000_000_000 ? value / 1_000 : value);
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
  const totalMinutes = Math.floor(Math.max(seconds, 0) / 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} 天 ${hours} 小时`;
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`;
  return `${minutes} 分钟`;
}

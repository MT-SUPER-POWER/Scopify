import type { MonthOption } from "@/lib/listeningReport/dateHelpers";
import { LISTENING_REPORT_MONTH_NAMES } from "@/constants/listeningReport";
import type { ListeningReportPeriod } from "@/types/api/listeningReport";
import type { ListeningReportSummary } from "@/types/listeningReport";
import type {
  ListeningReportDominantTimeOfDay,
  ListeningReportFooterSummary,
  ListeningReportNarrative,
} from "@/types/listeningReportNarrative";

const TIME_OF_DAY_COPY: Record<string, Omit<ListeningReportDominantTimeOfDay, "period">> = {
  afternoon: {
    label: "午后",
    sentence: "午后的声音，最常陪你把日子听得更松一点。",
  },
  deep_night: {
    label: "深夜",
    sentence: "深夜还亮着的那一刻，音乐知道你还没说完的话。",
  },
  early_morning: {
    label: "清晨",
    sentence: "清晨的声音，最常陪你开启新的一天。",
  },
  morning: {
    label: "上午",
    sentence: "上午的旋律，替你把一天慢慢调到合适的节奏。",
  },
  night: {
    label: "夜晚",
    sentence: "夜晚是你的聆听主场，音乐陪你把一天轻轻收好。",
  },
  noon: {
    label: "中午",
    sentence: "中午的片刻，音乐替你留住一点自己的时间。",
  },
};

const TIME_OF_DAY_ORDER: Record<string, number> = {
  early_morning: 0,
  morning: 1,
  noon: 2,
  afternoon: 3,
  night: 4,
  deep_night: 5,
};

const FALLBACK_TIME_OF_DAY: ListeningReportDominantTimeOfDay = {
  label: "每个时刻",
  period: null,
  sentence: "音乐在每个时刻，陪你成为自己。",
};

function cleanText(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function isMonth(month: number | null | undefined): month is number {
  return typeof month === "number" && Number.isInteger(month) && month >= 1 && month <= 12;
}

function isYear(year: number | null | undefined): year is number {
  return typeof year === "number" && Number.isInteger(year) && year > 0;
}

function isPositiveInteger(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getReportPeriod(
  summary: ListeningReportSummary | null | undefined,
): ListeningReportPeriod {
  return summary?.period ?? "month";
}

function getReportDate(
  summary: ListeningReportSummary | null | undefined,
  fallbackMonth: MonthOption,
) {
  return {
    month: isMonth(summary?.reportMonth) ? summary.reportMonth : fallbackMonth.month,
    year: isYear(summary?.reportYear) ? summary.reportYear : fallbackMonth.year,
  };
}

function getMonthName(month: number): string {
  return LISTENING_REPORT_MONTH_NAMES[month - 1] ?? "这个月";
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function normalizeTimestamp(timestamp: number | null | undefined): number | null {
  if (!isPositiveInteger(timestamp)) return null;

  // The endpoint currently uses milliseconds. Accept seconds too so older
  // cached report payloads do not render as 1970 dates.
  return timestamp < 100_000_000_000 ? timestamp * 1_000 : timestamp;
}

function getDateParts(timestamp: number | null | undefined) {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  if (normalizedTimestamp === null) return null;

  const date = new Date(normalizedTimestamp);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).formatToParts(date);

  const numericPart = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = numericPart("year");
  const month = numericPart("month");
  const day = numericPart("day");

  return isYear(year) && isMonth(month) && isPositiveInteger(day) ? { day, month, year } : null;
}

function formatDate(
  parts: { day: number; month: number; year: number },
  includeYear: boolean,
): string {
  return `${includeYear ? `${parts.year} 年 ` : ""}${parts.month} 月 ${parts.day} 日`;
}

function getWeekDateLabel(
  summary: ListeningReportSummary | null | undefined,
  fallbackMonth: MonthOption,
): string {
  const start = getDateParts(summary?.startTime);
  const end = getDateParts(summary?.endTime);

  if (start && end) {
    const includeStartYear = start.year !== end.year;
    return `${formatDate(start, includeStartYear)} — ${formatDate(end, true)}`;
  }
  if (start) return formatDate(start, true);
  if (end) return formatDate(end, true);

  return `${fallbackMonth.year} 年 ${fallbackMonth.month} 月`;
}

function getDateLabel(
  period: ListeningReportPeriod,
  summary: ListeningReportSummary | null | undefined,
  fallbackMonth: MonthOption,
): string {
  const { month, year } = getReportDate(summary, fallbackMonth);

  if (period === "year") return `${year} 年`;
  if (period === "week") return getWeekDateLabel(summary, fallbackMonth);
  return `${year} 年 ${month} 月`;
}

function getDominantTimeOfDay(
  summary: ListeningReportSummary | null | undefined,
): ListeningReportDominantTimeOfDay {
  const candidates = (summary?.timeOfDayDistributions ?? [])
    .filter(
      (item) =>
        typeof item.durationMinutes === "number" &&
        Number.isFinite(item.durationMinutes) &&
        item.durationMinutes > 0,
    )
    .sort((a, b) => {
      const durationDifference = b.durationMinutes - a.durationMinutes;
      if (durationDifference !== 0) return durationDifference;
      return (
        (TIME_OF_DAY_ORDER[a.period] ?? Number.MAX_SAFE_INTEGER) -
        (TIME_OF_DAY_ORDER[b.period] ?? Number.MAX_SAFE_INTEGER)
      );
    });
  const dominant = candidates[0];
  if (!dominant) return FALLBACK_TIME_OF_DAY;

  const copy = TIME_OF_DAY_COPY[dominant.period];
  if (!copy) {
    return {
      label: "某个时刻",
      period: dominant.period,
      sentence: "在某个时刻，音乐总会恰好陪在你身边。",
    };
  }

  return { ...copy, period: dominant.period };
}

function getDurationMinutes(summary: ListeningReportSummary | null | undefined): number | null {
  const minutes = summary?.playDurationMinutes;
  return typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0
    ? Math.round(minutes)
    : null;
}

/** Formats an API duration into a concise Chinese duration label. */
export function formatListeningReportDuration(minutes: number | null | undefined): string {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) return "0 分钟";

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const parts = [
    hours > 0 ? `${hours} 小时` : null,
    remainingMinutes > 0 ? `${remainingMinutes} 分钟` : null,
  ].filter((part): part is string => part !== null);

  return parts.join(" ") || "0 分钟";
}

function getDurationLabel(summary: ListeningReportSummary | null | undefined): string {
  const durationMinutes = getDurationMinutes(summary);
  if (durationMinutes !== null && durationMinutes > 0) {
    return formatListeningReportDuration(durationMinutes);
  }
  return cleanText(summary?.durationText) ?? "0 分钟";
}

function getMonthSubtitle(
  summary: ListeningReportSummary | null | undefined,
  year: number,
  month: number,
): string {
  const activeDays = summary?.activeDays;
  if (isPositiveInteger(activeDays) && activeDays >= getDaysInMonth(year, month)) {
    return `${getDaysInMonth(year, month)} 天里，你从未让音乐缺席。`;
  }
  if (isPositiveInteger(activeDays)) return `这个月，你在 ${activeDays} 天里为自己按下播放。`;
  return "这一段时间，音乐一直在替你收集生活的回声。";
}

function getWeekSubtitle(summary: ListeningReportSummary | null | undefined): string {
  const activeDays = summary?.activeDays;
  if (isPositiveInteger(activeDays) && activeDays >= 7) return "7 天里，音乐从未缺席。";
  if (isPositiveInteger(activeDays)) return `这一周，你在 ${activeDays} 天里让音乐陪在身边。`;
  return "这一周，留一点时间给你喜欢的声音。";
}

function getYearSubtitle(summary: ListeningReportSummary | null | undefined): string {
  const activeDays = summary?.activeDays;
  if (isPositiveInteger(activeDays) && activeDays >= 365) {
    return `${activeDays} 天里，音乐始终在场。`;
  }
  if (isPositiveInteger(activeDays)) return `这一年，你让音乐陪了自己 ${activeDays} 天。`;
  return "这一年，音乐替你记下了许多没有说出口的瞬间。";
}

function getAchievementLabel(
  period: ListeningReportPeriod,
  summary: ListeningReportSummary | null | undefined,
): string {
  const apiAchievement = cleanText(summary?.title);
  if (apiAchievement) return apiAchievement;

  if (period === "week") return "这一周的声音切片";
  if (period === "year") return "一整年的声音地图";
  return "属于你的声音形状";
}

/**
 * Builds a deterministic, UI-agnostic narrative from a listening-report
 * summary. It deliberately avoids the current date so historical reports stay
 * stable when they are revisited later.
 */
export function buildListeningReportNarrative(
  summary: ListeningReportSummary | null | undefined,
  fallbackMonth: MonthOption,
): ListeningReportNarrative {
  const period = getReportPeriod(summary);
  const { month, year } = getReportDate(summary, fallbackMonth);
  const monthName = getMonthName(month);

  if (period === "week") {
    return {
      achievementLabel: getAchievementLabel(period, summary),
      dateLabel: getDateLabel(period, summary, fallbackMonth),
      dominantTimeOfDay: getDominantTimeOfDay(summary),
      durationLabel: getDurationLabel(summary),
      eyebrow: "这一周的听歌回顾",
      headline: "这一周，你和音乐一起把日子过得有声。",
      subtitle: getWeekSubtitle(summary),
    };
  }

  if (period === "year") {
    return {
      achievementLabel: getAchievementLabel(period, summary),
      dateLabel: getDateLabel(period, summary, fallbackMonth),
      dominantTimeOfDay: getDominantTimeOfDay(summary),
      durationLabel: getDurationLabel(summary),
      eyebrow: `${year} 年的听歌回顾`,
      headline: "这一年，你把日子听成了一首长歌。",
      subtitle: getYearSubtitle(summary),
    };
  }

  return {
    achievementLabel: getAchievementLabel(period, summary),
    dateLabel: getDateLabel(period, summary, fallbackMonth),
    dominantTimeOfDay: getDominantTimeOfDay(summary),
    durationLabel: getDurationLabel(summary),
    eyebrow: `${year}年${monthName}的声音档案`,
    headline: `${monthName}，你把时间听成了自己的形状`,
    subtitle: getMonthSubtitle(summary, year, month),
  };
}

export function buildListeningReportFooterSummary(
  summary: ListeningReportSummary | null | undefined,
  fallbackMonth: MonthOption,
): ListeningReportFooterSummary {
  const period = getReportPeriod(summary);
  const { month, year } = getReportDate(summary, fallbackMonth);
  const monthName = getMonthName(month);
  const timeOfDay = getDominantTimeOfDay(summary);
  const timeLabel = timeOfDay.label || "清晨";
  const topGenre = summary?.topStyle?.genreName || summary?.topStylesList[0]?.genreName || "电子乐";

  const totalDays = getDaysInMonth(year, month);
  const activeDays = summary?.activeDays ?? totalDays;
  let attendancePhrase = `从未缺席的 ${totalDays} 天`;
  if (activeDays >= totalDays && totalDays > 0) {
    attendancePhrase = `从未缺席的 ${totalDays} 天`;
  } else if (activeDays > 0) {
    attendancePhrase = `持续在场的 ${activeDays} 天`;
  }

  let quote = `这就是你的${monthName}：${timeLabel}、${topGenre}，和${attendancePhrase}。`;
  if (period === "week") {
    quote = `这就是你的这一周：${timeLabel}、${topGenre}，和流动的旋律。`;
  } else if (period === "year") {
    quote = `这就是你的 ${year} 年：${timeLabel}、${topGenre}，和一路相伴的声音。`;
  }

  const brandingText = `Scopify · ${year}年${month}月`;
  const coverUrl = summary?.topSong?.imageUrl || summary?.wallpaperUrls[0] || null;

  return {
    brandingText,
    coverUrl,
    quote,
  };
}

export function buildTopSongSentiment(summary: ListeningReportSummary | null | undefined): string {
  const dominantTime = getDominantTimeOfDay(summary);
  if (dominantTime.period === "night" || dominantTime.period === "deep_night") {
    return "在万籁俱寂的夜色里，它最常替你收拢心绪。";
  }
  if (dominantTime.period === "early_morning" || dominantTime.period === "morning") {
    return "在这个时间里，它总是在第一时间唤醒你的情绪。";
  }
  return "在这个时间里，它是你最熟悉不过的声音与归宿。";
}

export function extractHeroCovers(summary: ListeningReportSummary | null | undefined): string[] {
  if (!summary) return [];
  const candidates = [
    summary.topSong?.imageUrl,
    ...summary.wallpaperUrls,
    ...summary.topSongsList.map((s) => s.coverUrl),
    summary.topArtist?.imageUrl,
    ...summary.topArtistsList.map((a) => a.avatarUrl),
  ].filter((url): url is string => Boolean(url));

  const seen = new Set<string>();
  const uniqueCovers: string[] = [];

  for (const candidate of candidates) {
    const identity = candidate.replace(/^https?:\/\/[^/]+/, "").split("?")[0] ?? candidate;
    if (seen.has(identity)) continue;
    seen.add(identity);
    uniqueCovers.push(candidate);
  }

  if (uniqueCovers.length > 0 && uniqueCovers.length < 12) {
    const base = [...uniqueCovers];
    while (uniqueCovers.length < 12) {
      for (const item of base) {
        uniqueCovers.push(item);
        if (uniqueCovers.length >= 12) break;
      }
    }
  }

  return uniqueCovers;
}

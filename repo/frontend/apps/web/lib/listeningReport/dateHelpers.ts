/**
 * Generates the list of available past months (e.g. past 12 months) for month-by-month historical reporting.
 */
export interface MonthOption {
  endTime?: number;
  isCurrent: boolean;
  key: string;
  label: string;
  month: number;
  year: number;
}

export function getAvailableMonths(count = 12): MonthOption[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const options: MonthOption[] = [];

  for (let i = 0; i < count; i++) {
    let year = currentYear;
    let month = currentMonth - i;

    while (month <= 0) {
      month += 12;
      year -= 1;
    }

    const isCurrent = i === 0;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const label = `${year}年${month}月`;

    if (isCurrent) {
      options.push({
        endTime: undefined,
        isCurrent: true,
        key,
        label: `${label} (本月)`,
        month,
        year,
      });
    } else {
      // 每月最后一天 0 点的时间戳
      // new Date(year, month, 0) gives the last day of the given month
      const lastDay = new Date(year, month, 0).getDate();
      const endTimestamp = new Date(year, month - 1, lastDay, 0, 0, 0, 0).getTime();

      options.push({
        endTime: endTimestamp,
        isCurrent: false,
        key,
        label,
        month,
        year,
      });
    }
  }

  return options;
}

/**
 * Formats duration in minutes into a human-friendly string (e.g. "2 小时 35 分钟" or "45 分钟").
 */
export function formatMinutesText(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes <= 0) return "0 分钟";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} 分钟`;
  if (mins === 0) return `${hrs} 小时`;
  return `${hrs} 小时 ${mins} 分钟`;
}

export interface MonthCalendarDay {
  dayNumber: number;
  durationMinutes: number;
  fullDate: string;
  hasListened: boolean;
  isToday: boolean;
}

/**
 * Generates calendar grid information for a specific month and year, mapped with listening activity.
 * Supports multiple date formats from NetEase API (YYYY-MM-DD, YYYYMMDD, MM-DD, timestamps, or full month attendance).
 */
export function getMonthCalendarGrid(
  year: number,
  month: number,
  dailyActivity: { date: string; durationMinutes: number }[],
  activeDaysTotal?: number | null,
): {
  days: MonthCalendarDay[];
  firstDayWeekday: number; // 0 for Sun, 1 for Mon... 6 for Sat
  totalDays: number;
} {
  const totalDays = new Date(year, month, 0).getDate();
  const firstDayWeekday = new Date(year, month - 1, 1).getDay();

  const now = new Date();
  const isCurrentYearMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const todayDate = now.getDate();

  // Build a multi-key lookup map
  const activityMap = new Map<string, number>();
  for (const act of dailyActivity) {
    const dur = act.durationMinutes;
    if (dur > 0) {
      activityMap.set(act.date, dur);

      // Also index by normalized formats
      const clean = act.date.replace(/[^\d]/g, "");
      if (clean.length === 8) {
        // e.g. 20260801 -> 2026-08-01
        activityMap.set(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`, dur);
        activityMap.set(`${Number(clean.slice(6, 8))}`, dur);
      } else if (clean.length === 4) {
        // e.g. 0801 -> 8-1
        activityMap.set(`${Number(clean.slice(2, 4))}`, dur);
      }

      // Check if act.date contains day number
      if (act.date.includes("-")) {
        const parts = act.date.split("-");
        const dayPart = parts[parts.length - 1];
        if (dayPart) {
          activityMap.set(String(Number(dayPart)), dur);
        }
      }
    }
  }

  const isFullAttendance = Boolean(
    activeDaysTotal && activeDaysTotal >= totalDays && dailyActivity.length === 0,
  );

  const days: MonthCalendarDay[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(month).padStart(2, "0");
    const fullDate = `${year}-${monthStr}-${dayStr}`;

    let duration =
      activityMap.get(fullDate) ??
      activityMap.get(`${year}/${monthStr}/${dayStr}`) ??
      activityMap.get(`${monthStr}-${dayStr}`) ??
      activityMap.get(`${month}-${day}`) ??
      activityMap.get(String(day)) ??
      0;

    // Fallback: If dailyActivity index matches day count
    if (duration === 0 && dailyActivity.length === totalDays) {
      duration = dailyActivity[day - 1]?.durationMinutes ?? 0;
    }

    const hasListened = duration > 0 || isFullAttendance;

    days.push({
      dayNumber: day,
      durationMinutes: duration,
      fullDate,
      hasListened,
      isToday: isCurrentYearMonth && day === todayDate,
    });
  }

  return {
    days,
    firstDayWeekday,
    totalDays,
  };
}

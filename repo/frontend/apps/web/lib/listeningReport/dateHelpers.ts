/**
 * Generates the list of available past weeks (e.g. past 12 weeks) for week-by-week historical reporting.
 */
export interface WeekOption {
  endTime?: number;
  isCurrent: boolean;
  key: string;
  label: string;
  subLabel?: string;
  weekIndex: number;
}

export function getAvailableWeeks(count = 12): WeekOption[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)
  // In NetEase, weekly report cycle cuts off at Saturday 00:00:00
  const daysSinceLastSaturday = (currentDay + 1) % 7;
  const lastSaturday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceLastSaturday,
    0,
    0,
    0,
    0,
  );

  const options: WeekOption[] = [];

  // Option 0: Current ongoing week (本周)
  const currentSunday = new Date(lastSaturday.getTime() + 1 * 24 * 60 * 60 * 1000);
  const curSunMonth = currentSunday.getMonth() + 1;
  const curSunDate = currentSunday.getDate();
  const curNowMonth = now.getMonth() + 1;
  const curNowDate = now.getDate();

  options.push({
    endTime: undefined,
    isCurrent: true,
    key: "current-week",
    label: "本周",
    subLabel: `${curSunMonth}.${curSunDate} - ${curNowMonth}.${curNowDate}`,
    weekIndex: 0,
  });

  // Past completed weeks (i = 0 is last completed Saturday week, i = 1 is 2 weeks ago, etc.)
  for (let i = 0; i < count; i++) {
    const saturday = new Date(lastSaturday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const sunday = new Date(saturday.getTime() - 6 * 24 * 60 * 60 * 1000);

    const satYear = saturday.getFullYear();
    const satMonth = saturday.getMonth() + 1;
    const satDate = saturday.getDate();
    const sunMonth = sunday.getMonth() + 1;
    const sunDate = sunday.getDate();

    const key = `${satYear}-${String(satMonth).padStart(2, "0")}-${String(satDate).padStart(2, "0")}`;
    const label = `${sunMonth}月${sunDate}日 - ${satMonth}月${satDate}日`;
    const subLabel = `${satYear}年 · 周六结算`;

    options.push({
      endTime: saturday.getTime(),
      isCurrent: false,
      key,
      label,
      subLabel,
      weekIndex: i + 1,
    });
  }

  return options;
}

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

export interface MonthHeatmapDay {
  dayNumber: number;
  durationMinutes: number;
  fullDate: string;
  hasListened: boolean;
  isToday: boolean;
  level: 0 | 1 | 2 | 3 | 4;
  weekday: number; // 0 for Sun, 1 for Mon ... 6 for Sat
}

export interface MonthHeatmapWeek {
  days: (MonthHeatmapDay | null)[]; // 7 items (Mon to Sun)
  weekIndex: number;
}

export function getMonthHeatmapGrid(
  year: number,
  month: number,
  dailyActivity: { date: string; durationMinutes: number }[],
  activeDaysTotal?: number | null,
): {
  days: MonthHeatmapDay[];
  maxDurationMinutes: number;
  totalActiveDays: number;
  totalDays: number;
  weeks: MonthHeatmapWeek[];
} {
  const { days, totalDays } = getMonthCalendarGrid(year, month, dailyActivity, activeDaysTotal);
  const maxDurationMinutes = Math.max(...days.map((d) => d.durationMinutes), 1);
  const totalActiveDays = days.filter((d) => d.hasListened).length;

  const heatmapDays: MonthHeatmapDay[] = days.map((day) => {
    const weekday = new Date(year, month - 1, day.dayNumber).getDay();
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (day.hasListened) {
      if (day.durationMinutes === 0) {
        level = 1;
      } else {
        const ratio = day.durationMinutes / maxDurationMinutes;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }
    }
    return {
      ...day,
      level,
      weekday,
    };
  });

  // Group into columns of weeks (Monday-indexed: 0=Mon, 1=Tue, ..., 6=Sun)
  // Or Sunday-indexed (0=Sun..6=Sat). Let's use Monday-first which is standard in China/GitHub
  const weeks: MonthHeatmapWeek[] = [];
  let currentWeekDays: (MonthHeatmapDay | null)[] = [];

  // Determine starting weekday of day 1 (Monday is index 0)
  const firstDay = heatmapDays[0];
  const firstDayWeekday = firstDay ? (firstDay.weekday === 0 ? 6 : firstDay.weekday - 1) : 0;

  for (let i = 0; i < firstDayWeekday; i++) {
    currentWeekDays.push(null);
  }

  for (const day of heatmapDays) {
    currentWeekDays.push(day);
    if (currentWeekDays.length === 7) {
      weeks.push({ days: currentWeekDays, weekIndex: weeks.length });
      currentWeekDays = [];
    }
  }

  if (currentWeekDays.length > 0) {
    while (currentWeekDays.length < 7) {
      currentWeekDays.push(null);
    }
    weeks.push({ days: currentWeekDays, weekIndex: weeks.length });
  }

  return {
    days: heatmapDays,
    maxDurationMinutes,
    totalActiveDays,
    totalDays,
    weeks,
  };
}

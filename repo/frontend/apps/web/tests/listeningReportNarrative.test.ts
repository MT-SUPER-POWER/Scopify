import { describe, expect, test } from "bun:test";

import {
  buildListeningReportNarrative,
  formatListeningReportDuration,
} from "@/lib/listeningReport/reportNarrative";
import type { MonthOption } from "@/lib/listeningReport/dateHelpers";
import type { ListeningReportSummary } from "@/types/listeningReport";

const FALLBACK_MONTH: MonthOption = {
  isCurrent: false,
  key: "2026-08",
  label: "2026年8月",
  month: 8,
  year: 2026,
};

function createSummary(overrides: Partial<ListeningReportSummary> = {}): ListeningReportSummary {
  return {
    activeDays: null,
    dailyActivity: [],
    durationText: null,
    endTime: null,
    period: "month",
    playDurationMinutes: null,
    reportMonth: 8,
    reportYear: 2026,
    sections: [],
    songCount: null,
    startTime: null,
    subtitle: null,
    timeOfDayDistributions: [],
    title: null,
    topArtist: null,
    topArtistsList: [],
    topErasList: [],
    topLanguagesList: [],
    topSong: null,
    topSongsList: [],
    topStyle: null,
    topStylesList: [],
    wallpaperUrls: [],
    ...overrides,
  };
}

describe("buildListeningReportNarrative", () => {
  test("turns a complete month into a personal attendance story", () => {
    const narrative = buildListeningReportNarrative(
      createSummary({
        activeDays: 31,
        durationText: "超过了 95% 的村民",
        playDurationMinutes: 1_525,
        timeOfDayDistributions: [
          { durationMinutes: 240, labelKey: "night", percentage: 60, period: "night" },
          { durationMinutes: 160, labelKey: "morning", percentage: 40, period: "morning" },
        ],
        title: "夜色收藏家",
      }),
      FALLBACK_MONTH,
    );

    expect(narrative).toMatchObject({
      achievementLabel: "夜色收藏家",
      dateLabel: "2026 年 8 月",
      durationLabel: "25 小时 25 分钟",
      eyebrow: "2026年八月的声音档案",
      headline: "八月，你把时间听成了自己的形状",
      subtitle: "31 天里，你从未让音乐缺席。",
    });
    expect(narrative.dominantTimeOfDay).toEqual({
      label: "夜晚",
      period: "night",
      sentence: "夜晚是你的聆听主场，音乐陪你把一天轻轻收好。",
    });
  });

  test("keeps sparse or missing data warm and safe", () => {
    const narrative = buildListeningReportNarrative(
      createSummary({
        activeDays: 3,
        playDurationMinutes: -10,
        reportMonth: null,
        reportYear: null,
      }),
      FALLBACK_MONTH,
    );

    expect(narrative).toMatchObject({
      achievementLabel: "属于你的声音形状",
      dateLabel: "2026 年 8 月",
      durationLabel: "0 分钟",
      headline: "八月，你把时间听成了自己的形状",
      subtitle: "这个月，你在 3 天里为自己按下播放。",
    });
    expect(narrative.dominantTimeOfDay).toEqual({
      label: "每个时刻",
      period: null,
      sentence: "音乐在每个时刻，陪你成为自己。",
    });
  });

  test("gives week reports their own date range and reflection", () => {
    const narrative = buildListeningReportNarrative(
      createSummary({
        activeDays: 5,
        endTime: Date.UTC(2026, 7, 31, 16),
        period: "week",
        startTime: Date.UTC(2026, 7, 25, 16),
      }),
      FALLBACK_MONTH,
    );

    expect(narrative).toMatchObject({
      achievementLabel: "这一周的声音切片",
      dateLabel: "8 月 26 日 — 2026 年 9 月 1 日",
      eyebrow: "这一周的听歌回顾",
      headline: "这一周，你和音乐一起把日子过得有声。",
      subtitle: "这一周，你在 5 天里让音乐陪在身边。",
    });
  });

  test("gives year reports a long-form reflection", () => {
    const narrative = buildListeningReportNarrative(
      createSummary({ activeDays: 366, period: "year", reportYear: 2024 }),
      FALLBACK_MONTH,
    );

    expect(narrative).toMatchObject({
      achievementLabel: "一整年的声音地图",
      dateLabel: "2024 年",
      eyebrow: "2024 年的听歌回顾",
      headline: "这一年，你把日子听成了一首长歌。",
      subtitle: "366 天里，音乐始终在场。",
    });
  });
});

describe("formatListeningReportDuration", () => {
  test("formats minutes with the smallest useful set of Chinese units", () => {
    expect(formatListeningReportDuration(null)).toBe("0 分钟");
    expect(formatListeningReportDuration(45)).toBe("45 分钟");
    expect(formatListeningReportDuration(120)).toBe("2 小时");
    expect(formatListeningReportDuration(1_525)).toBe("25 小时 25 分钟");
  });
});

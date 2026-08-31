import { describe, expect, test } from "bun:test";
import { formatMinutesText, getAvailableMonths } from "@/lib/listeningReport/dateHelpers";
import {
  formatListeningDuration,
  getListeningDurationSeconds,
} from "@/lib/listeningReport/normalize";
import { getListeningReportSummary } from "@/lib/listeningReport/reportSummary";
import { getPlaylistTrackCount } from "@/types/api/playlist";

describe("listening report normalization", () => {
  test("reads duration fields from the report payload", () => {
    expect(getListeningDurationSeconds({ data: { totalTime: 3_661 } })).toBe(3_661);
    expect(getListeningDurationSeconds({ data: { listenTime: 8_400 } })).toBe(8_400);
    expect(getListeningDurationSeconds({ data: { totalListeningTime: "7200" } })).toBe(7_200);
    expect(getListeningDurationSeconds({ data: { time: 180 } })).toBe(180);
    expect(getListeningDurationSeconds({ data: { totalDuration: 500 } })).toBe(500);
  });

  test("converts millisecond duration payloads before display", () => {
    expect(getListeningDurationSeconds({ data: { duration: 3_600_000_000 } })).toBe(3_600_000);
  });

  test("formats listening duration in hours directly", () => {
    expect(formatListeningDuration(3_600)).toBe("1 小时");
    expect(formatListeningDuration(86_400)).toBe("24 小时");
    expect(formatListeningDuration(360_000)).toBe("100 小时");
  });

  test("extracts comprehensive report summary with daily activity and habit distributions", () => {
    const mockPayload = {
      code: 200,
      data: {
        endTime: 1787932800000,
        listenTimeBlock: {
          blockType: "LISTEN_TIME_BLOCK",
          circleTimePeriodDurations: [
            { duration: 241, period: "night" },
            { duration: 68, period: "noon" },
            { duration: 26, period: "morning" },
          ],
          playDuration: 371,
          playDurationText: "超过了75%的村民",
          sections: [
            {
              field: "听歌最久",
              textB: "共收听269分钟",
              type: "maxPlayWeek",
              valueA: "1787673600000",
            },
          ],
        },
        listenTimeDistributionBlock: {
          achievementTitle: {
            mainTitle: "云村夜猫子",
            subTitle: "68%时间晚上听歌!",
          },
          durationDetails: [
            { audiobookDuration: 0, duration: 13, period: "2026-08-24", podcastDuration: 0 },
            { audiobookDuration: 0, duration: 271, period: "2026-08-26", podcastDuration: 0 },
          ],
          listenDays: 4,
        },
        startTime: 1787414400000,
        topAgeBlock: {
          sections: [{ age: "2010", playSongNum: 44 }],
        },
        topArtistBlock: {
          sections: [
            {
              artistId: 55851238,
              artistName: "Glichery",
              picUrl: "http://example.com/a.jpg",
              text: "5次",
            },
          ],
        },
        topLanguageBlock: {
          sections: [{ language: "英语", percent: "44", playSongNum: 41, songName: "Not to Me" }],
        },
        topSongBlock: {
          sections: [
            {
              field: "收听TOP1",
              picUrl: "http://example.com/s.jpg",
              songId: 1352585027,
              songName: "Not to Me",
              text: "4次",
            },
          ],
        },
        topStyleBlock: {
          genreEnglishName: "Electronic",
          genreId: 1015,
          genreName: "电子",
          sections: [
            { genreId: 1015, genreName: "电子", percent: "37" },
            { genreId: 1000, genreName: "流行", percent: "27" },
          ],
        },
        type: "week",
        wallpaperBlock: {
          picUrls: ["http://example.com/pic1.jpg"],
          songCount: 93,
        },
      },
    };

    const summary = getListeningReportSummary(mockPayload, "week");

    expect(summary.playDurationMinutes).toBe(371);
    expect(summary.durationText).toBe("超过了75%的村民");
    expect(summary.title).toBe("云村夜猫子");
    expect(summary.subtitle).toBe("68%时间晚上听歌!");
    expect(summary.activeDays).toBe(4);
    expect(summary.songCount).toBe(93);
    expect(summary.dailyActivity).toHaveLength(2);
    expect(summary.dailyActivity[0]?.dayLabel).toBe("8/24");
    expect(summary.timeOfDayDistributions.length).toBeGreaterThan(0);
    expect(summary.topSong?.title).toBe("Not to Me");
    expect(summary.topArtistsList[0]?.artistName).toBe("Glichery");
    expect(summary.topStylesList[0]?.genreName).toBe("电子");
    expect(summary.topStylesList[0]?.percentage).toBe(37);
    expect(summary.topLanguagesList[0]?.language).toBe("英语");
    expect(summary.topErasList[0]?.era).toBe("2010s");
  });
});

describe("listening report date helpers", () => {
  test("generates list of available past months with current month as default", () => {
    const months = getAvailableMonths(6);
    expect(months).toHaveLength(6);
    expect(months[0]?.isCurrent).toBe(true);
    expect(months[0]?.endTime).toBeUndefined();
    expect(months[1]?.isCurrent).toBe(false);
    expect(typeof months[1]?.endTime).toBe("number");
  });

  test("formats minutes to friendly string", () => {
    expect(formatMinutesText(45)).toBe("45 分钟");
    expect(formatMinutesText(120)).toBe("2 小时");
    expect(formatMinutesText(155)).toBe("2 小时 35 分钟");
  });
});

describe("recent playlist normalization", () => {
  test("uses alternate track count fields when recent-history records omit trackCount", () => {
    expect(getPlaylistTrackCount({ songCount: 12, trackCount: 0 })).toBe(12);
    expect(getPlaylistTrackCount({ trackIds: [{ id: 1 }, { id: 2 }] })).toBe(2);
  });
});

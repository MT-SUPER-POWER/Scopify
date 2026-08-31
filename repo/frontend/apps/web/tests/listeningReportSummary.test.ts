import { describe, expect, test } from "bun:test";

import { getListeningReportSummary } from "@/lib/listeningReport/reportSummary";

describe("listening report summary", () => {
  test("normalizes the period metrics from a report response", () => {
    expect(
      getListeningReportSummary(
        {
          data: {
            listenTimeBlock: { playDuration: 125, playDurationText: "125分钟" },
            listenTimeDistributionBlock: {
              achievementTitle: { mainTitle: "你的本周乐章", subTitle: "音乐陪伴了你 5 天" },
              listenDays: 5,
            },
            topArtistBlock: {
              artistName: "Avicii",
              avatarUrl: "https://example.com/artist.jpg",
              items: [{ field: "累计收听", mainText: "125分钟", subText: "就是离不开TA" }],
            },
            topSongBlock: {
              artists: [{ artistName: "Engelwood" }],
              items: [{ field: "收听次数", mainText: "20次", subText: "累计播放289分" }],
              picUrl: "https://example.com/song.jpg",
              songName: "crystal dolphin",
            },
            topStyleBlock: { genreEnglishName: "Electronic", genreName: "电子" },
            wallpaperBlock: { songCount: 17 },
          },
        },
        "week",
      ),
    ).toEqual({
      activeDays: 5,
      dailyActivity: [],
      durationText: "125分钟",
      endTime: null,
      period: "week",
      playDurationMinutes: 125,
      reportMonth: null,
      reportYear: null,
      sections: [],
      songCount: 17,
      startTime: null,
      subtitle: "音乐陪伴了你 5 天",
      timeOfDayDistributions: [],
      title: "你的本周乐章",
      topArtist: {
        details: [{ label: "累计收听", primary: "125分钟", secondary: "就是离不开TA" }],
        imageUrl: "https://example.com/artist.jpg",
        kicker: null,
        subtitle: null,
        title: "Avicii",
      },
      topArtistsList: [],
      topErasList: [],
      topLanguagesList: [],
      topSong: {
        details: [{ label: "收听次数", primary: "20次", secondary: "累计播放289分" }],
        imageUrl: "https://example.com/song.jpg",
        kicker: null,
        songId: undefined,
        subtitle: "Engelwood",
        title: "crystal dolphin",
      },
      topSongsList: [],
      topStyle: {
        genreEnglishName: "Electronic",
        genreName: "电子",
        imageUrl: null,
        sampleSong: null,
      },
      topStylesList: [],
      wallpaperUrls: [],
    });
  });

  test("leaves missing period metrics empty instead of inventing values", () => {
    expect(getListeningReportSummary({ data: {} }, "year")).toEqual({
      activeDays: null,
      dailyActivity: [],
      durationText: null,
      endTime: null,
      period: "year",
      playDurationMinutes: null,
      reportMonth: null,
      reportYear: null,
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
    });
  });
});

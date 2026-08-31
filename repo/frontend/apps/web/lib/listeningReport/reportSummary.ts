import type {
  CircleTimePeriodDuration,
  DurationDetail,
  ListeningReportArtist,
  ListeningReportData,
  ListeningReportInsightItem,
  ListeningReportPeriod,
  ListeningReportSection,
  TopAgeSectionItem,
  TopArtistSectionItem,
  TopLanguageSectionItem,
  TopSongSectionItem,
  TopStyleSectionItem,
  WallpaperItem,
} from "@/types/api/listeningReport";
import type {
  ListeningReportDailyActivityItem,
  ListeningReportEraItem,
  ListeningReportHighlight,
  ListeningReportHighlightDetail,
  ListeningReportKeySection,
  ListeningReportLanguageItem,
  ListeningReportRankArtist,
  ListeningReportRankSong,
  ListeningReportStyleInsight,
  ListeningReportStyleItem,
  ListeningReportSummary,
  ListeningReportTimeOfDayItem,
} from "@/types/listeningReport";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNonNegativeInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.round(parsed);
    }
  }
  return null;
}

function getDetails(
  items: ListeningReportInsightItem[] | undefined,
): ListeningReportHighlightDetail[] {
  return (items ?? []).flatMap((item) => {
    const primary = getString(item.mainText);
    return primary
      ? [
          {
            label: getString(item.field),
            primary,
            secondary: getString(item.subText),
          },
        ]
      : [];
  });
}

function getReportData(response: unknown): ListeningReportData | null {
  if (!isRecord(response)) return null;
  return isRecord(response.data)
    ? (response.data as ListeningReportData)
    : (response as ListeningReportData);
}

function getTopSong(data: ListeningReportData): ListeningReportHighlight | null {
  const block = data.topSongBlock;
  const directTitle = getString(block?.songName);
  const firstSection = (block?.sections ?? [])[0];
  const title = directTitle ?? getString(firstSection?.songName);
  if (!title) return null;

  const artists = (block?.artists ?? [])
    .map((artist) => getString(artist.artistName))
    .filter((artist): artist is string => artist !== null)
    .join(" / ");
  return {
    details: getDetails(block?.items),
    imageUrl: getString(block?.picUrl) ?? getString(firstSection?.picUrl),
    kicker: null,
    songId: block?.songId ?? firstSection?.songId,
    subtitle: artists || null,
    title,
  };
}

function getTopArtist(data: ListeningReportData): ListeningReportHighlight | null {
  const block = data.topArtistBlock;
  const directName = getString(block?.artistName);
  const firstSection = (block?.sections ?? [])[0];
  const title = directName ?? getString(firstSection?.artistName);
  if (!title) return null;

  return {
    details: getDetails(block?.items),
    imageUrl: getString(block?.avatarUrl) ?? getString(firstSection?.picUrl),
    kicker: null,
    subtitle: null,
    title,
  };
}

function getTopStyle(data: ListeningReportData): ListeningReportStyleInsight | null {
  const block = data.topStyleBlock;
  const genreName = getString(block?.genreName);
  if (!genreName) return null;

  return {
    genreEnglishName: getString(block?.genreEnglishName),
    genreName,
    imageUrl: getString(block?.picUrl),
    sampleSong: getString(block?.songName),
  };
}

function getAchievement(data: ListeningReportData) {
  return {
    subtitle: getString(data.listenTimeDistributionBlock?.achievementTitle?.subTitle),
    title: getString(data.listenTimeDistributionBlock?.achievementTitle?.mainTitle),
  };
}

function getDailyActivity(
  details: DurationDetail[] | undefined,
): ListeningReportDailyActivityItem[] {
  if (!details || !Array.isArray(details)) return [];

  return details.map((item) => {
    const rawDate = item.period ?? "";
    let dayLabel = rawDate;
    if (rawDate.includes("-")) {
      const parts = rawDate.split("-");
      if (parts.length >= 3) {
        dayLabel = `${Number(parts[1])}/${Number(parts[2])}`;
      }
    }
    return {
      audiobookMinutes: getNonNegativeInteger(item.audiobookDuration) ?? 0,
      date: rawDate,
      dayLabel,
      durationMinutes: getNonNegativeInteger(item.duration) ?? 0,
      podcastMinutes: getNonNegativeInteger(item.podcastDuration) ?? 0,
    };
  });
}

const TIME_OF_DAY_ORDER: Record<string, number> = {
  early_morning: 1,
  morning: 2,
  noon: 3,
  afternoon: 4,
  night: 5,
  deep_night: 6,
};

function getTimeOfDayDistributions(
  durations: CircleTimePeriodDuration[] | undefined,
): ListeningReportTimeOfDayItem[] {
  if (!durations || !Array.isArray(durations) || durations.length === 0) return [];

  const totalDuration = durations.reduce((sum, item) => sum + (item.duration || 0), 0);

  const sorted = [...durations].sort(
    (a, b) => (TIME_OF_DAY_ORDER[a.period] ?? 99) - (TIME_OF_DAY_ORDER[b.period] ?? 99),
  );

  return sorted.map((item) => ({
    durationMinutes: item.duration || 0,
    labelKey: `library.listeningReport.timeOfDay.${item.period}`,
    percentage: totalDuration > 0 ? Math.round(((item.duration || 0) / totalDuration) * 100) : 0,
    period: item.period,
  }));
}

function getTopSongsList(
  sections: TopSongSectionItem[] | undefined,
  wallpaperItems: WallpaperItem[] | undefined,
): ListeningReportRankSong[] {
  if (sections && Array.isArray(sections) && sections.length > 0) {
    return sections.map((sec, index) => ({
      artists: "",
      coverUrl: sec.picUrl,
      playCountText: sec.text,
      rank: index + 1,
      songId: sec.songId,
      songName: sec.songName,
    }));
  }

  if (wallpaperItems && Array.isArray(wallpaperItems)) {
    return wallpaperItems.slice(0, 10).map((item, index) => ({
      artists: (item.artists ?? []).map((a: ListeningReportArtist) => a.artistName).join(" / "),
      coverUrl: item.picUrl,
      playCountText: "",
      rank: index + 1,
      songId: item.songId,
      songName: item.songName,
    }));
  }

  return [];
}

function getTopArtistsList(
  sections: TopArtistSectionItem[] | undefined,
): ListeningReportRankArtist[] {
  if (!sections || !Array.isArray(sections)) return [];

  return sections.map((sec, index) => ({
    artistId: sec.artistId,
    artistName: sec.artistName,
    avatarUrl: sec.picUrl,
    playCountText: sec.text,
    rank: index + 1,
  }));
}

function getTopStylesList(sections: TopStyleSectionItem[] | undefined): ListeningReportStyleItem[] {
  if (!sections || !Array.isArray(sections)) return [];

  return sections.map((sec) => ({
    genreId: sec.genreId,
    genreName: sec.genreName,
    percentage: Number.parseFloat(sec.percent) || 0,
  }));
}

function getTopLanguagesList(
  sections: TopLanguageSectionItem[] | undefined,
): ListeningReportLanguageItem[] {
  if (!sections || !Array.isArray(sections)) return [];

  return sections.map((sec) => ({
    language: sec.language,
    percentage: Number.parseFloat(sec.percent) || 0,
    sampleSong: sec.songName,
    songCount: sec.playSongNum || 0,
  }));
}

function getTopErasList(sections: TopAgeSectionItem[] | undefined): ListeningReportEraItem[] {
  if (!sections || !Array.isArray(sections)) return [];

  return sections.map((sec) => ({
    era: `${sec.age}s`,
    songCount: sec.playSongNum || 0,
  }));
}

function getKeySections(
  sections: ListeningReportSection[] | undefined,
): ListeningReportKeySection[] {
  if (!sections || !Array.isArray(sections)) return [];

  return sections.map((sec) => ({
    field: sec.field ?? "",
    textB: sec.textB,
    type: sec.type,
    valueA: sec.valueA,
  }));
}

/**
 * Extracts documented, presentation-ready fields from `/listen/data/report`.
 */
export function getListeningReportSummary(
  response: unknown,
  period: ListeningReportPeriod,
): ListeningReportSummary {
  const data = getReportData(response);
  if (!data) {
    return {
      activeDays: null,
      dailyActivity: [],
      durationText: null,
      endTime: null,
      period,
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
    };
  }

  const achievement = getAchievement(data);
  const playDurationMinutes = getNonNegativeInteger(data.listenTimeBlock?.playDuration);
  const startTime = getNonNegativeInteger(data.startTime);
  const endTime = getNonNegativeInteger(data.endTime);
  const dailyActivity = getDailyActivity(data.listenTimeDistributionBlock?.durationDetails);

  let reportYear: number | null = null;
  let reportMonth: number | null = null;

  if (startTime && startTime > 0) {
    const sDate = new Date(startTime);
    reportYear = sDate.getFullYear();
    reportMonth = sDate.getMonth() + 1;
  } else if (endTime && endTime > 0) {
    const eDate = new Date(endTime);
    reportYear = eDate.getFullYear();
    reportMonth = eDate.getMonth() + 1;
  } else if (dailyActivity.length > 0 && dailyActivity[0]) {
    const firstDateStr = dailyActivity[0].date;
    const clean = firstDateStr.replace(/[^\d]/g, "");
    if (clean.length >= 6) {
      reportYear = Number.parseInt(clean.slice(0, 4), 10) || null;
      reportMonth = Number.parseInt(clean.slice(4, 6), 10) || null;
    } else if (firstDateStr.includes("-")) {
      const parts = firstDateStr.split("-");
      if (parts[0] && parts[1]) {
        reportYear = Number.parseInt(parts[0], 10) || null;
        reportMonth = Number.parseInt(parts[1], 10) || null;
      }
    }
  }

  return {
    activeDays: getNonNegativeInteger(data.listenTimeDistributionBlock?.listenDays),
    dailyActivity,
    durationText: getString(data.listenTimeBlock?.playDurationText),
    endTime,
    period,
    playDurationMinutes,
    reportMonth,
    reportYear,
    sections: getKeySections(data.listenTimeBlock?.sections),
    songCount: getNonNegativeInteger(data.wallpaperBlock?.songCount),
    startTime,
    subtitle: achievement.subtitle,
    timeOfDayDistributions: getTimeOfDayDistributions(
      data.listenTimeBlock?.circleTimePeriodDurations,
    ),
    title: achievement.title,
    topArtist: getTopArtist(data),
    topArtistsList: getTopArtistsList(data.topArtistBlock?.sections),
    topErasList: getTopErasList(data.topAgeBlock?.sections),
    topLanguagesList: getTopLanguagesList(data.topLanguageBlock?.sections),
    topSong: getTopSong(data),
    topSongsList: getTopSongsList(data.topSongBlock?.sections, data.wallpaperBlock?.items),
    topStyle: getTopStyle(data),
    topStylesList: getTopStylesList(data.topStyleBlock?.sections),
    wallpaperUrls: data.wallpaperBlock?.picUrls ?? [],
  };
}

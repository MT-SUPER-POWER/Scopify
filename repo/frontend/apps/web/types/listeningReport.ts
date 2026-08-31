import type { ListeningReportPeriod } from "@/types/api/listeningReport";

export interface ListeningReportSummary {
  activeDays: number | null;
  dailyActivity: ListeningReportDailyActivityItem[];
  durationText: string | null;
  endTime: number | null;
  period: ListeningReportPeriod;
  playDurationMinutes: number | null;
  reportMonth: number | null;
  reportYear: number | null;
  sections: ListeningReportKeySection[];
  songCount: number | null;
  startTime: number | null;
  subtitle: string | null;
  timeOfDayDistributions: ListeningReportTimeOfDayItem[];
  title: string | null;
  topArtist: ListeningReportHighlight | null;
  topArtistsList: ListeningReportRankArtist[];
  topErasList: ListeningReportEraItem[];
  topLanguagesList: ListeningReportLanguageItem[];
  topSong: ListeningReportHighlight | null;
  topSongsList: ListeningReportRankSong[];
  topStyle: ListeningReportStyleInsight | null;
  topStylesList: ListeningReportStyleItem[];
  wallpaperUrls: string[];
}

export interface ListeningReportHighlight {
  details: ListeningReportHighlightDetail[];
  imageUrl: string | null;
  kicker: string | null;
  songId?: number;
  subtitle: string | null;
  title: string;
}

export interface ListeningReportHighlightDetail {
  label: string | null;
  primary: string;
  secondary: string | null;
}

export interface ListeningReportDailyActivityItem {
  audiobookMinutes: number;
  date: string;
  dayLabel: string;
  durationMinutes: number;
  podcastMinutes: number;
}

export interface ListeningReportTimeOfDayItem {
  durationMinutes: number;
  labelKey: string;
  percentage: number;
  period: string;
}

export interface ListeningReportRankSong {
  artists: string;
  coverUrl?: string;
  playCountText: string;
  rank: number;
  songId: number;
  songName: string;
}

export interface ListeningReportRankArtist {
  artistId: number;
  artistName: string;
  avatarUrl?: string;
  playCountText: string;
  rank: number;
}

export interface ListeningReportStyleInsight {
  genreEnglishName: string | null;
  genreName: string;
  imageUrl: string | null;
  sampleSong: string | null;
}

export interface ListeningReportStyleItem {
  genreId: number;
  genreName: string;
  percentage: number;
}

export interface ListeningReportLanguageItem {
  language: string;
  percentage: number;
  sampleSong?: string;
  songCount: number;
}

export interface ListeningReportEraItem {
  era: string;
  sampleSong?: string;
  songCount: number;
}

export interface ListeningReportKeySection {
  field: string;
  textB?: string;
  type?: string;
  valueA?: string;
}

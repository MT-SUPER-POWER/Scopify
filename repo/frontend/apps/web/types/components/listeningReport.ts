import type { MonthOption } from "@/lib/listeningReport/dateHelpers";
import type { SongPlayRankItem, TodayListeningSongDTO } from "@/types/api/listeningReport";
import type { ListeningReportSummary } from "@/types/listeningReport";
import type { ListeningReportFooterSummary } from "@/types/listeningReportNarrative";

export interface ListeningReportActivityChartProps {
  summary: ListeningReportSummary;
}

export interface ListeningReportGrandFinaleBannerProps {
  footerSummary: ListeningReportFooterSummary;
}

export interface ListeningReportMonthPickerProps {
  onSelectMonth: (option: MonthOption) => void;
  selectedMonthKey: string;
}

export interface ListeningReportPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: MonthOption;
  summary: ListeningReportSummary;
}

export interface ListeningReportRecordWallProps {
  selectedMonth: MonthOption;
  summary: ListeningReportSummary;
}

export interface ListeningReportTasteDistributionProps {
  summary: ListeningReportSummary;
}

export interface ListeningReportTodayFeedProps {
  songs: TodayListeningSongDTO[];
}

export interface ListeningReportIsometricHeatmapProps {
  activeDays?: number | null;
  dailyActivity: Array<{ date: string; durationMinutes: number }>;
  reportMonth?: number | null;
  reportYear?: number | null;
}

export interface ListeningReportTimeOfDayRadarProps {
  summary: ListeningReportSummary;
}

export interface ListeningReportHeroPosterMuralProps {
  posters: Array<{
    artist: string;
    id: string | number;
    imageUrl: string;
    title: string;
  }>;
}

export interface ListeningReportHonorProps {
  activeDays: number | null;
  attendanceTarget: number | null;
  fallbackLabel: string;
}

export interface ListeningReportStoryHeroProps {
  isRefetching: boolean;
  onPeriodChange: (period: "month" | "week" | "year") => void;
  onRefresh: () => void;
  onSelectMonth: (option: MonthOption) => void;
  onSelectWeek: (option: import("@/lib/listeningReport/dateHelpers").WeekOption) => void;
  period: "month" | "week" | "year";
  selectedMonth: MonthOption;
  selectedMonthKey: string;
  selectedWeek: import("@/lib/listeningReport/dateHelpers").WeekOption;
  selectedWeekKey: string;
  summary: ListeningReportSummary;
}

export interface ListeningReportTopArtistsProps {
  summary: ListeningReportSummary;
}

export interface ListeningReportTopSongsProps {
  rankList?: SongPlayRankItem[];
  summary: ListeningReportSummary;
}

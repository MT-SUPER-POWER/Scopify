import type { ReactNode, Ref } from "react";

import type { MonthOption, WeekOption } from "@/lib/listeningReport/dateHelpers";
import type { SongPlayRankItem, TodayListeningSongDTO } from "@/types/listeningReport/api";
import type { ListeningReportSummary } from "@/types/listeningReport/model";
import type { ListeningReportFooterSummary } from "@/types/listeningReport/narrative";

export interface ListeningReportActivityChartProps {
  summary: ListeningReportSummary;
}

export interface ListeningReportGrandFinaleBannerProps {
  footerSummary: ListeningReportFooterSummary;
}

export interface ListeningReportMonthPickerProps {
  onSelectMonth: (month: MonthOption) => void;
  selectedMonthKey: string;
}

export interface ListeningReportWeekPickerProps {
  onSelectWeek: (week: WeekOption) => void;
  selectedWeekKey: string;
}

export interface ListeningReportPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: MonthOption;
  summary: ListeningReportSummary;
}

export interface ListeningReportReceiptProps {
  /** Disables the pointer tilt, e.g. while the receipt is zoomed in for reading. */
  interactive?: boolean;
  nickname: string;
  /** The printed slip itself, used as the image export source. */
  paperRef?: Ref<HTMLDivElement>;
  selectedMonth: MonthOption;
  summary: ListeningReportSummary;
}

export interface ListeningReportReceiptViewerProps extends ListeningReportReceiptProps {
  /** Extra actions rendered after the zoom controls in the bottom toolbar. */
  children?: ReactNode;
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
  covers: string[];
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

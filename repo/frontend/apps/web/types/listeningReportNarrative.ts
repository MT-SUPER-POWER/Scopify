import type { MonthOption } from "@/lib/listeningReport/dateHelpers";
import type { ListeningReportSummary } from "@/types/listeningReport";

export interface ListeningReportDominantTimeOfDay {
  label: string;
  period: string | null;
  sentence: string;
}

/**
 * Copy-ready language for the listening report's opening section.
 *
 * The report summary intentionally remains a faithful API projection. This
 * type is its narrative counterpart: a stable, UI-agnostic interpretation of
 * the same data.
 */
export interface ListeningReportNarrative {
  achievementLabel: string;
  dateLabel: string;
  dominantTimeOfDay: ListeningReportDominantTimeOfDay;
  durationLabel: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
}

export interface ListeningReportNarrativeInput {
  fallbackMonth: MonthOption;
  summary: ListeningReportSummary | null | undefined;
}

export interface ListeningReportFooterSummary {
  brandingText: string;
  coverUrl: string | null;
  quote: string;
}

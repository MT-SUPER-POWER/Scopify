import type { LucideIcon } from "lucide-react";

export interface ListeningReportPanelProps {
  isLoading: boolean;
  monthDurationSeconds: number | null;
  totalDurationSeconds: number | null;
  weekDurationSeconds: number | null;
}

export interface ListeningReportMetric {
  Icon: LucideIcon;
  label: string;
  value: string;
}

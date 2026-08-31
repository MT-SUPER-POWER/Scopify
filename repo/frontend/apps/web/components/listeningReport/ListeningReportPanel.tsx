import { BarChart3, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { formatListeningDuration } from "@/lib/listeningReport/normalize";
import type {
  ListeningReportMetric,
  ListeningReportPanelProps,
} from "@/types/components/listeningReport";

export function ListeningReportPanel({
  isLoading,
  monthDurationSeconds,
  totalDurationSeconds,
  weekDurationSeconds,
}: ListeningReportPanelProps) {
  if (
    !isLoading &&
    totalDurationSeconds === null &&
    weekDurationSeconds === null &&
    monthDurationSeconds === null
  ) {
    return null;
  }

  const metrics: ListeningReportMetric[] = [
    totalDurationSeconds === null
      ? null
      : {
          Icon: Clock3,
          label: "累计听歌时长",
          value: formatListeningDuration(totalDurationSeconds),
        },
    weekDurationSeconds === null
      ? null
      : {
          Icon: Sparkles,
          label: "本周听歌",
          value: formatListeningDuration(weekDurationSeconds),
        },
    monthDurationSeconds === null
      ? null
      : {
          Icon: CalendarDays,
          label: "本月听歌",
          value: formatListeningDuration(monthDurationSeconds),
        },
  ].filter((metric): metric is ListeningReportMetric => metric !== null);

  return (
    <section className="mx-6 mb-6 overflow-hidden rounded-2xl border border-content/10 bg-surface-elevated/80 shadow-panel md:mx-8 lg:mx-10 xl:mx-12">
      <div className="flex items-center gap-3 border-b border-content/10 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <BarChart3 className="size-5" />
        </div>
        <div>
          <h2 className="font-bold text-content">听歌报告</h2>
          <p className="text-xs text-content-muted">来自网易云的听歌足迹</p>
        </div>
      </div>
      <div className="grid divide-y divide-content/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {isLoading && metrics.length === 0
          ? [0, 1, 2].map((index) => (
              <div key={index} className="space-y-3 p-5">
                <div className="h-3 w-20 animate-pulse rounded bg-skeleton" />
                <div className="h-6 w-28 animate-pulse rounded bg-skeleton" />
              </div>
            ))
          : metrics.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-5">
                <Icon className="size-5 text-content-muted" />
                <div>
                  <p className="text-xs text-content-muted">{label}</p>
                  <p className="mt-1 text-lg font-black text-content">{value}</p>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}

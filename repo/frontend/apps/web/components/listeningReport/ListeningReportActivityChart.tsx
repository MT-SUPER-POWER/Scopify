"use client";

import type { ListeningReportActivityChartProps } from "@/types/components/listeningReport";

import { ListeningReportIsometricHeatmap } from "./ListeningReportIsometricHeatmap";
import { ListeningReportTimeOfDayRadar } from "./ListeningReportTimeOfDayRadar";

export function ListeningReportActivityChart({ summary }: ListeningReportActivityChartProps) {
  return (
    <section
      aria-labelledby="listening-report-rhythm-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-border/70 pt-10 sm:pt-14">
        <h2
          id="listening-report-rhythm-title"
          className="text-3xl font-black tracking-[-0.035em] text-content sm:text-4xl"
        >
          音乐在你的生活里怎样出现
        </h2>

        <div className="mt-8 grid items-stretch gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          {/* 左侧：2.5D Isometric 纯视觉立体地块 */}
          <ListeningReportIsometricHeatmap
            activeDays={summary.activeDays}
            dailyActivity={summary.dailyActivity}
            reportMonth={summary.reportMonth}
            reportYear={summary.reportYear}
          />

          {/* 右侧：6 时段音乐作息雷达图 */}
          <ListeningReportTimeOfDayRadar summary={summary} />
        </div>
      </div>
    </section>
  );
}

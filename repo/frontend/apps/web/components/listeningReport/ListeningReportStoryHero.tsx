"use client";

import { IconPhoto, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { useReportSongPlayback } from "@/hooks/listeningReport/useReportSongPlayback";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import {
  buildListeningReportNarrative,
  extractHeroCovers,
} from "@/lib/listeningReport/reportNarrative";
import type { ListeningReportStoryHeroProps } from "@/types/components/listeningReport";

import { ListeningReportHeader } from "./ListeningReportHeader";
import { ListeningReportHonor } from "./ListeningReportHonor";
import { ListeningReportHeroPosterMural } from "./ListeningReportHeroPosterMural";
import { ListeningReportPosterModal } from "./ListeningReportPosterModal";

export function ListeningReportStoryHero({
  isRefetching,
  onPeriodChange,
  onRefresh,
  onSelectMonth,
  onSelectWeek,
  period,
  selectedMonth,
  selectedMonthKey,
  selectedWeek: _selectedWeek,
  selectedWeekKey,
  summary,
}: ListeningReportStoryHeroProps) {
  const [isPosterOpen, setIsPosterOpen] = useState(false);
  const { playSong, playingSongId } = useReportSongPlayback();
  const showCoverCollage = useMediaQuery("(min-width: 640px)");
  const narrative = useMemo(
    () => buildListeningReportNarrative(summary, selectedMonth),
    [selectedMonth, summary],
  );

  const covers = useMemo(() => extractHeroCovers(summary), [summary]);
  const featuredSongId = summary.topSong?.songId;
  const isPlayingFeaturedSong = featuredSongId !== undefined && playingSongId === featuredSongId;
  const headlineLines =
    period === "month"
      ? narrative.headline.replace("听成", "\n听成").split("\n")
      : [narrative.headline];
  const reportYear = summary.reportYear ?? selectedMonth.year;
  const reportMonth = summary.reportMonth ?? selectedMonth.month;
  const attendanceTarget =
    period === "month" ? new Date(reportYear, reportMonth, 0).getDate() : null;

  const rawMinutes = summary.playDurationMinutes ?? 0;
  const hours = Math.floor(rawMinutes / 60);
  const remainingMinutes = rawMinutes % 60;

  return (
    <section
      aria-labelledby="listening-report-story-title"
      className="group/hero relative isolate flex h-screen min-h-screen w-full flex-col justify-center overflow-hidden bg-surface"
      data-testid="listening-report-story-hero"
    >
      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 z-0 size-full object-cover opacity-80"
        decoding="async"
        loading="eager"
        src="/images/listening-report/album-sleeve-texture.png"
      />

      {showCoverCollage && covers.length > 0 ? (
        <ListeningReportHeroPosterMural covers={covers} />
      ) : null}

      <div className="absolute inset-0 z-15 bg-linear-to-r from-surface via-surface/90 to-transparent sm:w-[62%] lg:w-[52%]" />
      <div className="absolute inset-x-0 bottom-0 z-15 h-32 bg-linear-to-t from-surface to-transparent" />

      <div className="absolute inset-x-0 top-20 z-20 mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12">
        <ListeningReportHonor
          activeDays={summary.activeDays}
          attendanceTarget={attendanceTarget}
          fallbackLabel={narrative.achievementLabel}
        />
      </div>

      <div className="relative z-20 mx-auto flex w-full max-w-360 flex-col justify-center px-5 pt-16 pb-6 sm:px-8 sm:pt-20 lg:px-12">
        <div className="max-w-xl lg:max-w-2xl">
          <div className="mb-5 lg:mb-6">
            <ListeningReportHeader
              isRefetching={isRefetching}
              onPeriodChange={onPeriodChange}
              onRefresh={onRefresh}
              onSelectMonth={onSelectMonth}
              onSelectWeek={onSelectWeek}
              period={period}
              selectedMonthKey={selectedMonthKey}
              selectedWeekKey={selectedWeekKey}
            />
          </div>

          <div>
            <h1
              id="listening-report-story-title"
              className="leading-1.1 text-3xl font-black tracking-tight text-content sm:text-4xl lg:text-5xl xl:text-6xl"
            >
              {headlineLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-content-muted lg:mt-4 lg:text-base">
              {narrative.subtitle}
            </p>
          </div>

          <p className="mt-5 flex flex-wrap items-baseline gap-x-2 text-content lg:mt-7 lg:gap-x-3">
            {hours > 0 ? (
              <>
                <span className="text-4xl font-black tracking-tight text-brand lg:text-6xl">
                  {hours}
                </span>
                <span className="text-sm font-black tracking-tight text-content lg:text-2xl">
                  小时
                </span>
              </>
            ) : null}
            <span className="text-4xl font-black tracking-tight text-content lg:text-6xl">
              {remainingMinutes || (hours === 0 ? 0 : 0)}
            </span>
            <span className="text-sm font-black tracking-tight text-content lg:text-2xl">分钟</span>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-8">
            <button
              type="button"
              onClick={() => featuredSongId && void playSong(featuredSongId)}
              disabled={!featuredSongId || isPlayingFeaturedSong}
              className="active:scale-0.98 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-black whitespace-nowrap text-brand-foreground shadow-brand transition-transform hover:scale-102 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconPlayerPlayFilled className="size-4" />
              <span>
                {isPlayingFeaturedSong
                  ? "正在准备代表曲"
                  : period === "month"
                    ? "播放本月代表曲"
                    : period === "week"
                      ? "播放本周代表曲"
                      : "播放年度代表曲"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsPosterOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border/80 bg-surface-elevated/60 px-6 text-sm font-bold whitespace-nowrap text-content backdrop-blur-md transition-all hover:scale-102 hover:border-brand/40 hover:bg-surface-elevated active:scale-98"
            >
              <IconPhoto className="size-4" stroke={2} />
              <span>生成海报</span>
            </button>
          </div>
        </div>
      </div>

      <ListeningReportPosterModal
        isOpen={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
        selectedMonth={selectedMonth}
        summary={summary}
      />
    </section>
  );
}

"use client";

import { IconCalendarMonth } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import {
  useListeningReportQuery,
  useListeningSongRankQuery,
  useTodayListeningSongsQuery,
} from "@/hooks/listeningReport/useListeningReportQuery";
import { buildListeningReportFooterSummary } from "@/lib/listeningReport/reportNarrative";
import {
  getAvailableMonths,
  getAvailableWeeks,
  type MonthOption,
  type WeekOption,
} from "@/lib/listeningReport/dateHelpers";
import { useI18n } from "@/store/module/i18n";
import type { ListeningReportPeriod } from "@/types/api/listeningReport";

import { ListeningReportGrandFinaleBanner } from "./ListeningReportGrandFinaleBanner";
import { ListeningReportHeader } from "./ListeningReportHeader";
import { ListeningReportRecordWall } from "./ListeningReportRecordWall";
import { ListeningReportStoryHero } from "./ListeningReportStoryHero";
import { ListeningReportTasteDistribution } from "./ListeningReportTasteDistribution";
import { ListeningReportTodayFeed } from "./ListeningReportTodayFeed";
import { ListeningReportTopArtists } from "./ListeningReportTopArtists";
import { ListeningReportTopSongs } from "./ListeningReportTopSongs";

const ListeningReportActivityChart = dynamic(
  () =>
    import("./ListeningReportActivityChart").then((module) => module.ListeningReportActivityChart),
  {
    loading: () => (
      <div className="mx-auto h-80 w-full max-w-360 animate-pulse bg-surface-raised/40" />
    ),
  },
);

export function ListeningReportView() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<ListeningReportPeriod>("month");
  const availableMonths = useMemo(() => getAvailableMonths(12), []);

  const [selectedMonth, setSelectedMonth] = useState<MonthOption>(() => {
    const currentMonth = getAvailableMonths(1)[0];
    if (!currentMonth) throw new Error("Unable to create the current listening-report month");
    return currentMonth;
  });

  const [selectedWeek, setSelectedWeek] = useState<WeekOption>(() => {
    const currentWeek = getAvailableWeeks(1)[0];
    if (!currentWeek) throw new Error("Unable to create the current listening-report week");
    return currentWeek;
  });

  const endTime =
    period === "month"
      ? selectedMonth.endTime
      : period === "week"
        ? selectedWeek.endTime
        : undefined;
  const supportsSongRank = period !== "year";

  const reportQuery = useListeningReportQuery(period, endTime);
  const songRankQuery = useListeningSongRankQuery(
    period === "year" ? "month" : period,
    endTime,
    supportsSongRank,
  );
  const todaySongsQuery = useTodayListeningSongsQuery();
  const summary = reportQuery.data;
  const isRefetching = reportQuery.isRefetching || songRankQuery.isRefetching;

  const footerSummary = useMemo(
    () => buildListeningReportFooterSummary(summary, selectedMonth),
    [selectedMonth, summary],
  );

  useEffect(() => {
    const reportYear = summary?.reportYear;
    const reportMonth = summary?.reportMonth;
    if (period !== "month" || !reportYear || !reportMonth) return;

    setSelectedMonth((previousMonth) => {
      if (previousMonth.year === reportYear && previousMonth.month === reportMonth) {
        return previousMonth;
      }

      const availableMonth = availableMonths.find(
        (month) => month.year === reportYear && month.month === reportMonth,
      );
      if (availableMonth) return availableMonth;

      const lastDay = new Date(reportYear, reportMonth, 0).getDate();
      return {
        endTime: new Date(reportYear, reportMonth - 1, lastDay, 0, 0, 0, 0).getTime(),
        isCurrent: false,
        key: `${reportYear}-${String(reportMonth).padStart(2, "0")}`,
        label: `${reportYear}年${reportMonth}月`,
        month: reportMonth,
        year: reportYear,
      };
    });
  }, [availableMonths, period, summary?.reportMonth, summary?.reportYear]);

  const handleRefresh = () => {
    void reportQuery.refetch();
    if (supportsSongRank) void songRankQuery.refetch();
    if (period === "week" || selectedMonth.isCurrent) void todaySongsQuery.refetch();
  };

  const isMonthDataMatching = useMemo(() => {
    if (period !== "month" || !summary?.reportMonth) return true;
    return summary.reportMonth === selectedMonth.month;
  }, [period, selectedMonth.month, summary?.reportMonth]);

  const hasContent = Boolean(
    summary &&
    isMonthDataMatching &&
    (summary.activeDays !== null ||
      summary.durationText !== null ||
      summary.playDurationMinutes !== null ||
      summary.songCount !== null ||
      summary.topSong !== null ||
      summary.topArtist !== null ||
      summary.topStyle !== null ||
      summary.dailyActivity.length > 0 ||
      summary.timeOfDayDistributions.length > 0 ||
      (supportsSongRank && songRankQuery.data && songRankQuery.data.length > 0)),
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-surface pb-32">
      {reportQuery.isError ? (
        <div className="flex h-screen w-full items-center justify-center px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border/80 bg-surface-overlay/80 p-8 shadow-panel">
            <NetworkRetryState
              title={t("network.offline.title")}
              subtitle={t("network.offline.subtitle")}
              actionLabel={t("network.action.refresh")}
              isRetrying={reportQuery.isRefetching}
              onRetry={handleRefresh}
            />
          </div>
        </div>
      ) : reportQuery.isLoading ? (
        <div className="flex h-screen w-full animate-pulse items-center justify-center px-5 sm:px-8 lg:px-12">
          <div className="mx-auto grid min-h-120 w-full max-w-360 gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-5">
              <div className="h-9 w-72 rounded-full bg-surface-elevated" />
              <div className="h-28 max-w-xl rounded-2xl bg-surface-elevated" />
              <div className="h-12 w-72 rounded-xl bg-surface-elevated" />
              <div className="h-11 w-80 rounded-full bg-surface-elevated" />
            </div>
            <div className="hidden rounded-3xl bg-surface-raised lg:block" />
          </div>
        </div>
      ) : summary && hasContent ? (
        <div>
          {/* 首屏满高 Hero 区域 */}
          <ListeningReportStoryHero
            isRefetching={isRefetching}
            onPeriodChange={setPeriod}
            onRefresh={handleRefresh}
            onSelectMonth={setSelectedMonth}
            onSelectWeek={setSelectedWeek}
            period={period}
            selectedMonth={selectedMonth}
            selectedMonthKey={selectedMonth.key}
            selectedWeek={selectedWeek}
            selectedWeekKey={selectedWeek.key}
            summary={summary}
          />

          {/* 下方数据分区 */}
          <ListeningReportTopSongs
            rankList={supportsSongRank ? songRankQuery.data : undefined}
            summary={summary}
          />
          <ListeningReportActivityChart summary={summary} />
          <ListeningReportTopArtists summary={summary} />
          <ListeningReportTasteDistribution summary={summary} />
          <ListeningReportRecordWall selectedMonth={selectedMonth} summary={summary} />
          {/* 底部大块总结横幅（Grand Finale Banner） */}
          <ListeningReportGrandFinaleBanner footerSummary={footerSummary} />

          {(period === "week" || (period === "month" && selectedMonth.isCurrent)) &&
          todaySongsQuery.data &&
          todaySongsQuery.data.length > 0 ? (
            <div className="mx-auto mt-10 w-full max-w-360 px-5 sm:px-8 lg:px-12">
              <ListeningReportTodayFeed songs={todaySongsQuery.data} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-screen w-full flex-col justify-center px-5 pt-16 sm:px-8 lg:px-12">
          <div className="mx-auto mb-8 flex w-full max-w-360 justify-start">
            <ListeningReportHeader
              isRefetching={isRefetching}
              onPeriodChange={setPeriod}
              onRefresh={handleRefresh}
              onSelectMonth={setSelectedMonth}
              onSelectWeek={setSelectedWeek}
              period={period}
              selectedMonthKey={selectedMonth.key}
              selectedWeekKey={selectedWeek.key}
            />
          </div>

          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center text-center">
            <IconCalendarMonth className="size-10 text-brand" stroke={1.35} />
            <h2 className="mt-5 text-xl font-black text-content">
              {period === "month"
                ? `${selectedMonth.label}暂无已结算的月度收听报告`
                : period === "week"
                  ? `${selectedWeek.label}暂无收听周报数据`
                  : t("library.listeningReport.empty")}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-content-muted">
              {period === "month"
                ? "月度听歌报告通常会在下一月初结算。你可以切换到更早的月份，看看那时的自己。"
                : period === "week"
                  ? "周报数据通常在每周六结算生成。你可以切换到更早的周期查看历史周报。"
                  : "当前周期暂无听歌活动记录，先去听几首喜欢的歌吧。"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

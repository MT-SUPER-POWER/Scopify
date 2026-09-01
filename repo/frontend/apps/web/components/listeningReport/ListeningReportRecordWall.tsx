"use client";

import { useMemo } from "react";

import { LISTENING_REPORT_MONTH_NAMES } from "@/constants/listeningReport";
import type { ListeningReportRecordWallProps } from "@/types/components/listeningReport";

export function ListeningReportRecordWall({
  selectedMonth,
  summary,
}: ListeningReportRecordWallProps) {
  const effectiveMonth = summary.reportMonth ?? selectedMonth.month;
  const monthName = LISTENING_REPORT_MONTH_NAMES[effectiveMonth - 1] ?? "这段时间";
  const covers = useMemo(
    () => [...new Set(summary.wallpaperUrls)].slice(0, 30),
    [summary.wallpaperUrls],
  );

  const rows = useMemo(() => {
    const r1: string[] = [];
    const r2: string[] = [];

    covers.forEach((url, i) => {
      if (i % 2 === 0) r1.push(url);
      else r2.push(url);
    });

    const ensureLoop = (arr: string[]) => {
      if (arr.length === 0) return [];
      let res = [...arr];
      while (res.length < 8) {
        res = [...res, ...arr];
      }
      return [...res, ...res];
    };

    return [ensureLoop(r1), ensureLoop(r2)];
  }, [covers]);

  if (covers.length === 0) return null;

  return (
    <section
      aria-labelledby="listening-report-wall-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-border/70 pt-10 sm:pt-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2
              id="listening-report-wall-title"
              className="text-3xl font-black tracking-[-0.035em] text-content sm:text-4xl"
            >
              {summary.songCount
                ? `${summary.songCount} 首歌，拼成${monthName}的底片`
                : `${monthName}的封面底片`}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-content-muted">
              从你的真实播放记录里，留下这一段时间最直观的颜色与面孔。
            </p>
          </div>
        </div>

        {/* 上下错位双向连续滚动的底片流 */}
        <div className="relative -mx-5 mt-8 overflow-hidden py-2 sm:-mx-8 lg:-mx-12">
          {/* 左侧消融暗影 */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-surface to-transparent sm:w-28" />
          {/* 右侧消融暗影 */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-surface to-transparent sm:w-28" />

          <div className="flex flex-col gap-3 sm:gap-4">
            {/* 第 1 行：向左平滑循环滚动 */}
            <div
              className="animate-marquee-left flex gap-3 sm:gap-4"
              style={{ animationDuration: "48s" }}
            >
              {rows[0]?.map((url, index) => (
                <div
                  key={`r1-${url}-${index}`}
                  className="group relative size-36 shrink-0 overflow-hidden rounded-xl bg-surface-raised shadow-md transition-transform duration-500 hover:scale-105 sm:size-44 lg:size-52"
                >
                  <img
                    alt=""
                    className="size-full object-cover transition duration-700 group-hover:scale-108"
                    decoding="async"
                    loading="lazy"
                    src={url}
                  />
                </div>
              ))}
            </div>

            {/* 第 2 行：向右平滑循环滚动（上下错位流向） */}
            <div
              className="animate-marquee-right flex gap-3 sm:gap-4"
              style={{ animationDuration: "54s" }}
            >
              {rows[1]?.map((url, index) => (
                <div
                  key={`r2-${url}-${index}`}
                  className="group relative size-36 shrink-0 overflow-hidden rounded-xl bg-surface-raised shadow-md transition-transform duration-500 hover:scale-105 sm:size-44 lg:size-52"
                >
                  <img
                    alt=""
                    className="size-full object-cover transition duration-700 group-hover:scale-108"
                    decoding="async"
                    loading="lazy"
                    src={url}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useMemo } from "react";

import type { ListeningReportTasteDistributionProps } from "@/types/components/listeningReport";

export function ListeningReportTasteDistribution({
  summary,
}: ListeningReportTasteDistributionProps) {
  const eras = useMemo(
    () =>
      [...summary.topErasList].sort((a, b) =>
        a.era.localeCompare(b.era, undefined, { numeric: true }),
      ),
    [summary.topErasList],
  );
  const maxEraCount = Math.max(...eras.map((era) => era.songCount), 1);
  const hasTaste =
    summary.topStylesList.length > 0 ||
    summary.topLanguagesList.length > 0 ||
    eras.length > 0 ||
    summary.topStyle !== null;

  if (!hasTaste) return null;

  return (
    <section
      aria-labelledby="listening-report-taste-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="pt-10 sm:pt-14">
        <div>
          <h2
            id="listening-report-taste-title"
            className="text-3xl font-black tracking-[-0.035em] text-content sm:text-4xl"
          >
            你的审美有了清晰的轮廓
          </h2>
          <p className="mt-2 text-sm text-content-muted">
            {summary.topStyle?.genreName
              ? `这个阶段最偏爱${summary.topStyle.genreName}。`
              : "曲风、语言和年代不是标签，而是你一次次选择之后留下的方向。"}
          </p>
        </div>

        <div className="my-8 grid gap-8 md:grid-cols-3 lg:gap-12">
          {/* 1. 曲风倾向 */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-content-muted uppercase">
              曲风倾向
            </h3>
            <div className="mt-4 space-y-4">
              {summary.topStylesList.slice(0, 4).map((style) => (
                <div key={style.genreId} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 font-bold text-content">{style.genreName}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(style.percentage, 3)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-semibold text-content-muted tabular-nums">
                    {style.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 语言习惯 */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-content-muted uppercase">
              语言习惯
            </h3>
            <div className="mt-4 space-y-4">
              {summary.topLanguagesList.slice(0, 4).map((lang) => (
                <div key={lang.language} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 font-bold text-content">{lang.language}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(lang.percentage, 3)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-right font-semibold text-content-muted tabular-nums">
                    {lang.percentage}%{lang.songCount > 0 ? ` / ${lang.songCount}首` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 年代跨度 */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-content-muted uppercase">
              年代跨度
            </h3>
            <div className="mt-4 space-y-4">
              {eras.slice(0, 4).map((era) => (
                <div key={era.era} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 font-bold text-content">{era.era}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.max((era.songCount / maxEraCount) * 100, 3)}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-right font-semibold text-content-muted tabular-nums">
                    {era.songCount}首
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

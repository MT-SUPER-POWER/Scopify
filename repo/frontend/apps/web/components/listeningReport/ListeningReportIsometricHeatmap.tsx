"use client";

import { useMemo, useState } from "react";

import { LISTENING_REPORT_PILLAR_COLORS } from "@/constants/listeningReport";
import { getMonthHeatmapGrid, type MonthHeatmapDay } from "@/lib/listeningReport/dateHelpers";
import type { ListeningReportIsometricHeatmapProps } from "@/types/components/listeningReport";

export function ListeningReportIsometricHeatmap({
  activeDays,
  dailyActivity,
  reportMonth,
  reportYear,
}: ListeningReportIsometricHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<MonthHeatmapDay | null>(null);

  const year = reportYear ?? new Date().getFullYear();
  const month = reportMonth ?? new Date().getMonth() + 1;
  const heatmap = useMemo(
    () => getMonthHeatmapGrid(year, month, dailyActivity, activeDays),
    [activeDays, dailyActivity, month, year],
  );

  const streaks = useMemo(() => {
    let longest = 0;
    let current = 0;
    for (const day of heatmap.days) {
      if (day.hasListened) {
        current += 1;
        if (current > longest) longest = current;
      } else {
        current = 0;
      }
    }
    return {
      current,
      longest: longest || heatmap.totalActiveDays,
    };
  }, [heatmap.days, heatmap.totalActiveDays]);

  const isometricVoxels = useMemo(() => {
    const list: Array<{
      col: number;
      day: MonthHeatmapDay;
      depth: number;
      h: number;
      isoX: number;
      isoY: number;
      row: number;
    }> = [];
    const originX = 140,
      originY = 70,
      dx = 14,
      dy = 7.5;
    const maxDur = heatmap.maxDurationMinutes || 1;
    const minH = 5,
      maxH = 48;

    heatmap.weeks.forEach((week, col) => {
      week.days.forEach((day, row) => {
        if (!day) return;
        let h = 0;
        if (day.hasListened) {
          if (day.durationMinutes > 0) {
            const ratio = Math.min(Math.max(day.durationMinutes / maxDur, 0), 1);
            h = Math.round(minH + Math.pow(ratio, 0.75) * (maxH - minH));
          } else {
            h = minH;
          }
        }

        list.push({
          col,
          day,
          depth: col + row,
          h,
          isoX: originX + (col - row) * dx,
          isoY: originY + (col + row) * dy,
          row,
        });
      });
    });
    return list.sort((a, b) => a.depth - b.depth);
  }, [heatmap.maxDurationMinutes, heatmap.weeks]);

  return (
    <div className="relative flex min-h-95 flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-surface-raised/40 p-6 sm:p-7">
      {/* 2.5D Isometric SVG 画布 */}
      <div className="relative my-auto flex w-full items-center justify-center">
        <svg
          aria-label="收听热力图"
          className="h-60 w-full max-w-md overflow-visible select-none sm:h-68"
          viewBox="0 0 280 190"
        >
          <defs>
            <filter id="voxel-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="2"
                floodColor="var(--scopify-brand)"
                floodOpacity="0.6"
              />
            </filter>
          </defs>

          {isometricVoxels.map(({ day, h, isoX, isoY }) => {
            const isHovered = hoveredDay?.dayNumber === day.dayNumber;
            const colors =
              LISTENING_REPORT_PILLAR_COLORS[day.level] ?? LISTENING_REPORT_PILLAR_COLORS[0];
            const effH = isHovered ? h + 3 : h;
            const rx = 12,
              ry = 6,
              d = 12;

            return (
              <g
                key={`iso-day-${day.dayNumber}`}
                className="cursor-pointer transition-all duration-300"
                filter={isHovered ? "url(#voxel-glow)" : undefined}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {effH > 0 ? (
                  <>
                    <polygon
                      fill={isHovered ? "#16a34a" : colors.left}
                      points={`${isoX - rx},${isoY + ry - effH} ${isoX},${isoY + d - effH} ${isoX},${isoY + d} ${isoX - rx},${isoY + ry}`}
                      stroke={colors.stroke}
                      strokeWidth={0.5}
                    />
                    <polygon
                      fill={isHovered ? "#15803d" : colors.right}
                      points={`${isoX},${isoY + d - effH} ${isoX + rx},${isoY + ry - effH} ${isoX + rx},${isoY + ry} ${isoX},${isoY + d}`}
                      stroke={colors.stroke}
                      strokeWidth={0.5}
                    />
                  </>
                ) : null}
                <polygon
                  fill={isHovered ? "#86efac" : colors.top}
                  points={`${isoX},${isoY - effH} ${isoX + rx},${isoY + ry - effH} ${isoX},${isoY + d - effH} ${isoX - rx},${isoY + ry - effH}`}
                  stroke={isHovered ? "var(--scopify-brand)" : colors.stroke}
                  strokeWidth={0.7}
                />
              </g>
            );
          })}
        </svg>

        {hoveredDay ? (
          <div className="pointer-events-none absolute top-0 right-0 rounded-xl border border-brand/40 bg-surface-overlay/95 px-3 py-1.5 text-xs shadow-floating backdrop-blur-md">
            <p className="font-bold text-content">{hoveredDay.fullDate}</p>
            <p className="mt-0.5 font-semibold text-brand">
              {hoveredDay.hasListened
                ? `收听 ${hoveredDay.durationMinutes} 分钟`
                : "当日无收听记录"}
            </p>
          </div>
        ) : null}
      </div>

      {/* 底部指标区：左侧 Streaks 连续卡片 + 右侧色阶 */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border/40 pt-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface-elevated/40 px-3.5 py-1.5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-brand">{streaks.longest}</span>
              <span className="text-[10px] font-bold text-content-muted">天</span>
            </div>
            <p className="text-[10px] font-semibold text-content-muted">最长连续</p>
          </div>
          <div className="h-5 w-px bg-border/60" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-content">{heatmap.totalActiveDays}</span>
              <span className="text-[10px] font-bold text-content-muted">天</span>
            </div>
            <p className="text-[10px] font-semibold text-content-muted">累计出勤</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pb-1 text-xs font-semibold text-content-muted">
          <span className="text-[10px]">少</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span
              key={`legend-${lvl}`}
              className="inline-block size-2.5 rounded-xs border border-white/10"
              style={{ backgroundColor: LISTENING_REPORT_PILLAR_COLORS[lvl]?.top }}
            />
          ))}
          <span className="text-[10px]">多</span>
        </div>
      </div>
    </div>
  );
}

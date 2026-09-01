"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import {
  LISTENING_REPORT_ORDERED_PERIOD_KEYS,
  LISTENING_REPORT_TIME_OF_DAY_META,
} from "@/constants/listeningReport";
import type { ListeningReportTimeOfDayRadarProps } from "@/types/components/listeningReport";

function RadarTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { fullLabel?: string; percentage?: number } }>;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-xl border border-brand/40 bg-surface-overlay/95 px-3 py-1.5 text-xs shadow-floating backdrop-blur-md">
      <p className="font-bold text-content">{data.fullLabel}</p>
      <p className="mt-0.5 font-semibold text-brand">占比 {data.percentage}%</p>
    </div>
  );
}

export function ListeningReportTimeOfDayRadar({ summary }: ListeningReportTimeOfDayRadarProps) {
  const dominantPeriod = useMemo(() => {
    if (summary.timeOfDayDistributions.length === 0) return null;
    return summary.timeOfDayDistributions.reduce((peak, item) =>
      item.percentage > peak.percentage ? item : peak,
    );
  }, [summary.timeOfDayDistributions]);

  const timeOfDayMap = useMemo(
    () => new Map(summary.timeOfDayDistributions.map((item) => [item.period, item.percentage])),
    [summary.timeOfDayDistributions],
  );

  const radarData = useMemo(() => {
    return LISTENING_REPORT_ORDERED_PERIOD_KEYS.map((key) => {
      const config = LISTENING_REPORT_TIME_OF_DAY_META[key] ?? {
        label: key,
        order: 0,
        timeRange: "",
      };
      const percentage = timeOfDayMap.get(key) ?? 0;
      return {
        fullLabel: `${config.label} (${config.timeRange})`,
        percentage,
        period: config.label,
        periodKey: key,
      };
    });
  }, [timeOfDayMap]);

  return (
    <div className="relative flex min-h-95 flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-surface-raised/40 p-6 sm:p-7">
      {/* 极坐标雷达图画布 */}
      <div className="relative my-auto flex h-60 w-full items-center justify-center sm:h-68">
        <ResponsiveContainer height="100%" width="100%">
          <RadarChart
            data={radarData}
            margin={{ bottom: 15, left: 24, right: 24, top: 15 }}
            outerRadius="72%"
          >
            <PolarGrid gridType="polygon" stroke="var(--color-border, rgba(255, 255, 255, 0.12))" />
            <PolarAngleAxis
              dataKey="period"
              tick={{ fill: "var(--color-content, #f4f4f5)", fontSize: 11, fontWeight: 700 }}
            />
            <RechartsTooltip content={<RadarTooltipContent />} cursor={false} />
            <Radar
              activeDot={{
                fill: "var(--color-brand, #22c55e)",
                r: 3.5,
                stroke: "var(--color-surface, #09090b)",
                strokeWidth: 1.5,
              }}
              dataKey="percentage"
              dot={{
                fill: "var(--color-brand, #22c55e)",
                r: 2,
                stroke: "transparent",
              }}
              fill="var(--color-brand, #22c55e)"
              fillOpacity={0.35}
              name="占比"
              stroke="var(--color-brand, #22c55e)"
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 极简底部：时段分布胶囊 */}
      <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-4 sm:grid-cols-6">
        {LISTENING_REPORT_ORDERED_PERIOD_KEYS.map((key) => {
          const config = LISTENING_REPORT_TIME_OF_DAY_META[key] ?? {
            label: key,
            order: 0,
            timeRange: "",
          };
          const percentage = timeOfDayMap.get(key) ?? 0;
          const isDominant = dominantPeriod?.period === key;

          return (
            <div
              key={`time-pill-${key}`}
              className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-colors ${
                isDominant
                  ? "border border-brand/40 bg-brand/15 text-brand"
                  : "bg-surface-elevated/40 text-content-muted"
              }`}
            >
              <span className="text-[10px] font-semibold">{config.label}</span>
              <span className="text-xs font-black text-content">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

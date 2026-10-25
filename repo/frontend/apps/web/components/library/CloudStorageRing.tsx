"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import { formatCacheSize } from "@/lib/cache/presentation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { CloudStorageRingProps } from "@/types/components/library";

// 与右侧 PanelsTopLeft（size-5、描边约 1.7px）保持同等视觉重量。
const RING_SIZE = 18;
const RING_STROKE = 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function CloudStorageRing({ maxSize, songCount, usedSize }: CloudStorageRingProps) {
  const { t } = useI18n();
  if (maxSize <= 0) return null;

  const ratio = Math.min(usedSize / maxSize, 1);
  const percent = ratio * 100;
  const percentLabel = percent > 0 && percent < 0.1 ? "<0.1" : percent.toFixed(1);
  const label = t("library.cloud.storage", { percent: percentLabel });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-9 cursor-default items-center justify-center rounded-full transition-colors hover:bg-content/10"
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
            aria-hidden="true"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              className="text-content/15"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              // 极小占比也保留一小段弧，避免看起来像未加载。
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.max(ratio, 0.02))}
              className={cn(
                "transition-[stroke-dashoffset] duration-500",
                ratio >= 0.95 ? "text-danger" : ratio >= 0.8 ? "text-warning" : "text-brand",
              )}
            />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums opacity-80">
          {t("library.cloud.storageDetail", {
            total: formatCacheSize(maxSize),
            used: formatCacheSize(usedSize),
          })}
        </span>
        <span className="tabular-nums opacity-80">
          {t("library.cloud.storageSongs", {
            count: songCount,
            free: formatCacheSize(Math.max(maxSize - usedSize, 0)),
          })}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

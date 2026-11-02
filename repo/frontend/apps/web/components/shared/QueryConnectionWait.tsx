"use client";

import { Clock3 } from "lucide-react";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { useTranslation } from "react-i18next";
import { useConnectionStatus } from "@/hooks/core/useQueryRecovery";
import { isConnectionNoticeVisible } from "@/lib/query/recovery";
import { cn } from "@/lib/utils";
import type { QueryConnectionWaitProps } from "@/types/query/boundaryComponents";

const COMPACT_TILES = 4;

/** 连接失败的区域保持骨架等待恢复；原因与重试入口统一在顶部连接横条。 */
export function QueryConnectionWait({ title, compact }: QueryConnectionWaitProps) {
  const { t } = useTranslation();
  const { phase } = useConnectionStatus();
  const isNoticeVisible = isConnectionNoticeVisible(phase);

  return (
    <section aria-label={title} aria-busy className="space-y-3">
      {title ? <h2 className="text-xl font-bold text-content">{title}</h2> : null}
      <div className="relative">
        <div className={cn("transition-opacity duration-500", isNoticeVisible && "opacity-60")}>
          {compact ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-hidden>
              {Array.from({ length: COMPACT_TILES }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-lg bg-skeleton" />
                  <Skeleton className="h-3 w-2/3 bg-skeleton-subtle" />
                </div>
              ))}
            </div>
          ) : (
            <Skeleton className="h-72 w-full rounded-xl bg-skeleton" aria-hidden />
          )}
        </div>
        <div
          role="status"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500",
            isNoticeVisible ? "opacity-100" : "opacity-0",
          )}
        >
          {isNoticeVisible ? (
            <span className="flex items-center gap-1.5 rounded-full bg-surface-raised/90 px-3 py-1 text-xs text-content-muted">
              <Clock3 aria-hidden className="size-3.5" />
              {t("network.recovery.waiting")}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

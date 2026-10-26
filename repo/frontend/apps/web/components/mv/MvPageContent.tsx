"use client";

import { useCallback, useState } from "react";
import { MvComments } from "./MvComments";
import { MvInfo } from "./MvInfo";
import { MvSimilarContent } from "./MvSimilarContent";
import { MvPlayer } from "./MvPlayer";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryPending } from "@/components/shared/QueryPending";
import type { MvPageContentProps } from "@/types/components/mv";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvCover } from "@/lib/music/mvCover";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

/** MV 页（参考 YouTube 观看页）：播放器、信息与评论在左，相似 MV 在右（窄窗口时排到下方）。 */
export function MvPageContent({ mvid }: MvPageContentProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const detailQuery = useMVDetailQuery(mvid, { boundary: true });
  const [next, setNext] = useState<readonly [number, number | null] | null>(null);
  const nextId = next?.[0] === mvid ? next[1] : null;
  const handleNextChange = useCallback((id: number | null) => setNext([mvid, id]), [mvid]);
  const detail = detailQuery.data?.data;
  const [isTheater, setIsTheater] = useState(false);
  const toggleTheater = useCallback(() => setIsTheater((value) => !value), []);

  const poster = detail ? getMvCover(detail) : "";

  return (
    <div
      className={cn(
        "mx-auto grid w-full gap-x-6 text-content xl:grid-cols-[minmax(0,1fr)_402px]",
        isTheater ? "max-w-none pb-10" : "max-w-400 p-6 pb-10",
      )}
    >
      {/* 只用布局样式切换剧场模式，保持播放器实例和进度。 */}
      <div
        key={`player-${mvid}`}
        className={cn("min-w-0 xl:col-start-1 xl:row-start-1", isTheater && "col-span-full")}
      >
        {detailQuery.isPending ? (
          <QueryPending isPaused={detailQuery.fetchStatus === "paused"} />
        ) : (
          <MvPlayer
            mvid={mvid}
            isTheater={isTheater}
            onToggleTheater={toggleTheater}
            resolutions={detail?.brs ?? []}
            poster={poster ? getSizedImageUrl(poster, 1280) : undefined}
            onNext={nextId ? () => void smartRouter.push(`/mv?id=${nextId}`) : undefined}
          />
        )}
      </div>
      <div
        key={`info-${mvid}`}
        className={cn("min-w-0 xl:col-start-1 xl:row-start-2", isTheater && "px-6")}
      >
        {detail ? (
          <MvInfo detail={detail} isSubscribed={Boolean(detailQuery.data?.subed)} />
        ) : (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-8 w-2/3 bg-skeleton" />
            <Skeleton className="h-4 w-1/3 bg-skeleton" />
          </div>
        )}

        <MvComments mvid={mvid} />
      </div>

      <aside
        className={cn(
          "min-w-0 xl:col-start-2",
          isTheater ? "p-6 xl:row-start-2" : "mt-6 xl:row-span-2 xl:row-start-1 xl:mt-0",
        )}
      >
        <QueryBoundary resetKey={`mv:similar:${mvid}`} title={t("mv.section.similar")} compact>
          {detail ? (
            <MvSimilarContent
              key={mvid}
              mvid={mvid}
              detail={detail}
              onNextChange={handleNextChange}
            />
          ) : null}
        </QueryBoundary>
      </aside>
    </div>
  );
}

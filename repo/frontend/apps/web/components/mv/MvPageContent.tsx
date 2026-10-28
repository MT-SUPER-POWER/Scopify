"use client";

import { useCallback, useEffect, useState } from "react";
import { MvComments } from "./MvComments";
import { MvInfo } from "./MvInfo";
import { MvSimilarContent } from "./MvSimilarContent";
import { MvPlayer } from "./MvPlayer";
import { MvInfoSkeleton, MvSimilarSkeleton } from "./MvSkeletons";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryPending } from "@/components/shared/QueryPending";
import type { MvPageContentProps } from "@/types/mv/components";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvCover } from "@/lib/music/mvCover";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
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
  const isPlayerBarHidden = useUiStore((state) => state.isPlayerBarHidden);
  const setIsPlayerBarHidden = useUiStore((state) => state.setIsPlayerBarHidden);
  const toggleTheater = useCallback(() => {
    setIsTheater(!isTheater);
    setIsPlayerBarHidden(!isTheater);
  }, [isTheater, setIsPlayerBarHidden]);
  useEffect(() => () => setIsPlayerBarHidden(false), [setIsPlayerBarHidden]);

  const poster = detail ? getMvCover(detail) : "";

  return (
    <div
      className={cn(
        "mx-auto grid w-full gap-x-6 text-content xl:grid-rows-[min-content_1fr]",
        isTheater
          ? "max-w-none bg-surface pb-10 xl:grid-cols-[minmax(0,1fr)_520px] dark:bg-[#0f0f0f]"
          : "max-w-400 p-6 pb-10 xl:grid-cols-[minmax(0,1fr)_402px]",
      )}
    >
      {/* 只用布局样式切换剧场模式，保持播放器实例和进度。 */}
      <div
        key={`player-${mvid}`}
        className={cn("min-w-0 xl:col-start-1 xl:row-start-1", isTheater && "col-span-full")}
      >
        {detailQuery.isPending ? (
          <div
            className={cn(
              "overflow-hidden rounded-xl",
              isTheater
                ? isPlayerBarHidden
                  ? "h-[min(82dvh,calc(100dvh-8rem))] min-h-64 w-full"
                  : "h-[min(75dvh,calc(100dvh-8rem))] min-h-64 w-full"
                : "aspect-video w-full",
            )}
          >
            {detailQuery.fetchStatus === "paused" ? (
              <QueryPending isPaused />
            ) : (
              <Skeleton className="size-full bg-skeleton" />
            )}
          </div>
        ) : (
          <MvPlayer
            mvid={mvid}
            isTheater={isTheater}
            isPlayerBarHidden={isPlayerBarHidden}
            onTogglePlayerBar={() => setIsPlayerBarHidden(!isPlayerBarHidden)}
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
          <MvInfoSkeleton />
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
              isTheater={isTheater}
              onNextChange={handleNextChange}
            />
          ) : detailQuery.isPending && detailQuery.fetchStatus !== "paused" ? (
            <MvSimilarSkeleton isTheater={isTheater} />
          ) : null}
        </QueryBoundary>
      </aside>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { MvComments } from "./MvComments";
import { MvInfo } from "./MvInfo";
import { MvListItem } from "./MvListItem";
import { MvPlayer } from "./MvPlayer";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useSimilarMVsQuery } from "@/hooks/mv/useMVDiscoveryQueries";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvCover } from "@/lib/music/mvCover";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

/** MV 页（参考 YouTube 观看页）：播放器、信息与评论在左，相似 MV 在右（窄窗口时排到下方）。 */
export function MvPage() {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const mvid = Number(useSearchParams().get("id")) || 0;
  const detailQuery = useMVDetailQuery(mvid || null);
  const similarMvs = useSimilarMVsQuery(mvid || null).data?.mvs ?? [];
  const detail = detailQuery.data?.data;
  const [isTheater, setIsTheater] = useState(false);
  const toggleTheater = useCallback(() => setIsTheater((value) => !value), []);

  if (!mvid) {
    return (
      <p className="flex min-h-[60vh] items-center justify-center text-lg font-medium text-content-muted">
        {t("mv.status.invalid")}
      </p>
    );
  }

  if (detailQuery.isError && !detail) {
    return (
      <div className="pt-8">
        <NetworkRetryState
          title={t("network.offline.title")}
          subtitle={t("mv.status.unavailable")}
          actionLabel={t("network.action.refresh")}
          onRetry={() => void detailQuery.refetch()}
        />
      </div>
    );
  }

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
        <MvPlayer
          mvid={mvid}
          isTheater={isTheater}
          onToggleTheater={toggleTheater}
          resolutions={detail?.brs ?? []}
          poster={poster ? getSizedImageUrl(poster, 1280) : undefined}
          onNext={
            similarMvs[0] ? () => void smartRouter.push(`/mv?id=${similarMvs[0].id}`) : undefined
          }
        />
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

      {similarMvs.length > 0 && (
        <aside
          className={cn(
            "min-w-0 xl:col-start-2",
            isTheater ? "p-6 xl:row-start-2" : "mt-6 xl:row-span-2 xl:row-start-1 xl:mt-0",
          )}
        >
          <h2 className="mb-2 text-base font-bold">{t("mv.section.similar")}</h2>
          <ul className="-mx-1 flex flex-col gap-1">
            {similarMvs.map((item) => (
              <li key={item.id}>
                <MvListItem mv={item} href={`/mv?id=${item.id}`} size="md" />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

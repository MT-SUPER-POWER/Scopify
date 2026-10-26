"use client";

import { useSearchParams } from "next/navigation";
import { MvInfo } from "./MvInfo";
import { MvListItem } from "./MvListItem";
import { MvPlayer } from "./MvPlayer";
import { CommentPreviewList } from "@/components/Comment/CommentPreviewList";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useSimilarMVsQuery } from "@/hooks/mv/useMVDiscoveryQueries";
import { useMVCommentsQuery, useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvCover } from "@/lib/music/mvCover";
import { useI18n } from "@/store/module/i18n";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

const HOT_COMMENT_PARAMS = { limit: 5 };

/** MV 页：播放器与信息在左，相似 MV 在右（窄窗口时排到下方）。 */
export function MvPage() {
  const { t } = useI18n();
  const mvid = Number(useSearchParams().get("id")) || 0;
  const detailQuery = useMVDetailQuery(mvid || null);
  const similarMvs = useSimilarMVsQuery(mvid || null).data?.mvs ?? [];
  const commentsQuery = useMVCommentsQuery(mvid || null, HOT_COMMENT_PARAMS);
  const detail = detailQuery.data?.data;
  const hotComments = commentsQuery.data?.hotComments?.length
    ? commentsQuery.data.hotComments
    : (commentsQuery.data?.comments ?? []);

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
    <div className="mx-auto grid w-full max-w-400 gap-8 p-6 pb-10 text-content xl:grid-cols-[minmax(0,1fr)_380px]">
      {/* 切换 MV 时整列重建，播放器与展开状态从头开始 */}
      <div key={mvid} className="min-w-0">
        <MvPlayer
          mvid={mvid}
          resolutions={detail?.brs ?? []}
          poster={poster ? getSizedImageUrl(poster, 1280) : undefined}
        />
        {detail ? (
          <MvInfo detail={detail} isSubscribed={Boolean(detailQuery.data?.subed)} />
        ) : (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-8 w-2/3 bg-skeleton" />
            <Skeleton className="h-4 w-1/3 bg-skeleton" />
          </div>
        )}

        {hotComments.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold">
              {t("mv.section.comments")}
              {commentsQuery.data?.total ? (
                <span className="ml-2 text-sm font-normal text-content-muted">
                  {commentsQuery.data.total.toLocaleString()}
                </span>
              ) : null}
            </h2>
            <CommentPreviewList comments={hotComments} className="-mx-4" />
          </section>
        )}
      </div>

      {similarMvs.length > 0 && (
        <aside className="min-w-0">
          <h2 className="mb-2 text-lg font-bold">{t("mv.section.similar")}</h2>
          <ul className="-mx-2 flex flex-col">
            {similarMvs.map((item) => (
              <li key={item.id}>
                <MvListItem mv={item} href={`/mv?id=${item.id}`} />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

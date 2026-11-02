"use client";

import { Fragment } from "react";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { MvComments } from "./_components/MvComments";
import { MvInfo } from "./_components/MvInfo";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { useMvId } from "@/hooks/mv/useMvId";

/** 播放器下方：信息与评论。换 MV 时整块重建，不沿用上一个的展开状态与评论。 */
export default function MvPage() {
  const mvid = useMvId();
  const detailQuery = useMVDetailQuery(mvid, { boundary: true });
  const detail = detailQuery.data?.data;
  return (
    <Fragment key={mvid}>
      {detail ? (
        <MvInfo detail={detail} isSubscribed={Boolean(detailQuery.data?.subed)} />
      ) : (
        <div aria-hidden className="mt-4">
          <Skeleton className="h-7 w-2/3 bg-skeleton" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full bg-skeleton" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-skeleton" />
                <Skeleton className="h-3 w-20 bg-skeleton" />
              </div>
              <Skeleton className="h-9 w-16 rounded-full bg-skeleton" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
              <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
              <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
            </div>
          </div>
          <Skeleton className="mt-4 h-20 w-full rounded-xl bg-skeleton" />
        </div>
      )}
      <MvComments mvid={mvid} />
    </Fragment>
  );
}

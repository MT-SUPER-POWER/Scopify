"use client";

import { Fragment } from "react";
import { MvComments } from "./_components/MvComments";
import { MvInfo } from "./_components/MvInfo";
import { MvInfoSkeleton } from "./_components/MvInfoSkeleton";
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
        <MvInfoSkeleton />
      )}
      <MvComments mvid={mvid} />
    </Fragment>
  );
}

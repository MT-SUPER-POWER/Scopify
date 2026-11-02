"use client";

import { MvSimilarContent } from "./_components/MvSimilarContent";
import { MvSimilarSkeleton } from "./_components/MvSimilarSkeleton";
import { useMvPage } from "../_components/MvPageProvider";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { useMvId } from "@/hooks/mv/useMvId";
import { useTranslation } from "react-i18next";

export default function MvSimilarSlot() {
  const { t } = useTranslation();
  const mvid = useMvId();
  const { isTheater, onNextChange } = useMvPage();
  const detailQuery = useMVDetailQuery(mvid, { boundary: true });
  const detail = detailQuery.data?.data;
  return (
    <QueryBoundary resetKey={`mv:similar:${mvid}`} title={t("mv.section.similar")} compact>
      {detail ? (
        <MvSimilarContent
          key={mvid}
          mvid={mvid}
          detail={detail}
          isTheater={isTheater}
          onNextChange={onNextChange}
        />
      ) : detailQuery.isPending && detailQuery.fetchStatus !== "paused" ? (
        <MvSimilarSkeleton isTheater={isTheater} />
      ) : null}
    </QueryBoundary>
  );
}

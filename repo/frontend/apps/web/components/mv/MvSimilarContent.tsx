"use client";

import { useEffect } from "react";
import { MvListItem } from "@/components/mv/MvListItem";
import { QueryPending } from "@/components/shared/QueryPending";
import { useSimilarMVsQuery } from "@/hooks/mv/useMVDiscoveryQueries";
import { useI18n } from "@/store/module/i18n";
import type { MvSimilarContentProps } from "@/types/components/mv";

export function MvSimilarContent({ mvid, onNextChange }: MvSimilarContentProps) {
  const { t } = useI18n();
  const query = useSimilarMVsQuery(mvid, { boundary: true });
  const nextId = query.data?.mvs[0]?.id ?? null;
  useEffect(() => {
    onNextChange(nextId);
    return () => onNextChange(null);
  }, [nextId, onNextChange]);
  if (query.isPending) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  const mvs = query.data?.mvs ?? [];
  if (!mvs.length) return null;
  return (
    <>
      <h2 className="mb-2 text-base font-bold">{t("mv.section.similar")}</h2>
      <ul className="-mx-1 flex flex-col gap-1">
        {mvs.map((item) => (
          <li key={item.id}>
            <MvListItem mv={item} href={`/mv?id=${item.id}`} size="md" />
          </li>
        ))}
      </ul>
    </>
  );
}

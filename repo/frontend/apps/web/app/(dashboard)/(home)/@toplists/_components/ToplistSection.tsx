"use client";

import { ToplistCard } from "./ToplistCard";
import { useHome } from "../../_components/HomeProvider";
import { useToplistDetailQuery } from "@/hooks/home/useHomeQueries";
import { useTranslation } from "react-i18next";

import type { ToplistDetailItem } from "@/types/home/toplistApi";

const OFFICIAL_TOPLIST_IDS = [19723756, 3779629, 3778678, 2884035];

export function ToplistSection() {
  const { t } = useTranslation();
  const { actions } = useHome();
  const query = useToplistDetailQuery();

  const list = query.data.list ?? [];
  const charts = new Map(list.map((item) => [item.id, item]));
  const official = OFFICIAL_TOPLIST_IDS.map((id) => charts.get(id)).filter(
    (item): item is ToplistDetailItem => Boolean(item?.tracks?.length),
  );
  const remaining = list.filter(
    (item) => !OFFICIAL_TOPLIST_IDS.includes(item.id) && item.tracks?.length,
  );
  const toplists = [...official, ...remaining].slice(0, 4);

  if (toplists.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
          {t("home.toplists")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {toplists.map((toplist) => (
          <ToplistCard
            key={toplist.id}
            toplist={toplist}
            isLoading={actions.loadingPlayId === `playlist-${toplist.id}`}
            onPlay={actions.handlePlayPlaylist}
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import { ToplistCard } from "./ToplistCard";
import { useHome } from "../../_components/HomeProvider";
import { useToplistsQuery } from "@/hooks/home/useHomeQueries";
import { useTranslation } from "react-i18next";

/** The cards the section shows; the platform lists its best charts first. */
const VISIBLE_TOPLISTS = 4;

export function ToplistSection() {
  const { t } = useTranslation();
  const { actions } = useHome();
  const query = useToplistsQuery();
  const toplists = query.data.slice(0, VISIBLE_TOPLISTS);

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
            key={toplist.ref.id}
            toplist={toplist}
            isLoading={actions.loadingPlayId === `playlist-${toplist.ref.id}`}
            onPlay={actions.handlePlayPlaylist}
          />
        ))}
      </div>
    </section>
  );
}

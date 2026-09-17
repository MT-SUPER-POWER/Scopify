"use client";

import { ToplistCard } from "@/components/home/ToplistCard";
import { useI18n } from "@/store/module/i18n";
import type { ToplistSectionProps } from "@/types/components/home";

export function ToplistSection({ loadingPlayId, onPlayToplist, toplists }: ToplistSectionProps) {
  const { t } = useI18n();

  if (toplists.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
          {t("home.toplists")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {toplists.map((toplist) => (
          <ToplistCard
            key={toplist.id}
            toplist={toplist}
            isLoading={loadingPlayId === `playlist-${toplist.id}`}
            onPlay={onPlayToplist}
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useI18n } from "@/store/module/i18n";

export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  const { t } = useI18n();

  return (
    <div className="mb-4 flex items-end justify-between">
      <h2
        className="cursor-pointer text-2xl font-bold tracking-tight hover:underline"
        onClick={onSeeAll}
      >
        {title}
      </h2>
      <button
        onClick={onSeeAll}
        className="text-sm font-bold text-content-muted hover:text-content hover:underline"
      >
        {t("common.action.seeAll")}
      </button>
    </div>
  );
}

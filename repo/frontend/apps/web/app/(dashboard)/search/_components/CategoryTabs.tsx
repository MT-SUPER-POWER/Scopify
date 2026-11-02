"use client";

import { useSearchParams } from "next/navigation";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { buildSearchCategoryUrl, getSearchCategory } from "@/lib/search/searchCategory";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { CATEGORIES, type Category } from "@/types/search/model";

export function CategoryTabs() {
  const { t } = useTranslation();
  const router = useSmartRouter();
  const searchParams = useSearchParams();
  const active = getSearchCategory(searchParams.get("tab"));
  const onChange = (category: Category) => {
    router.replace(buildSearchCategoryUrl(searchParams.toString(), category));
  };
  const labelMap: Record<Category, string> = {
    All: t("search.category.all"),
    Songs: t("search.category.songs"),
    Artists: t("search.category.artists"),
    Playlists: t("search.category.playlists"),
    Albums: t("search.category.albums"),
    Lyrics: t("search.category.lyrics"),
    Sheets: t("songResources.sheets"),
    MVs: t("search.category.mvs"),
    Podcasts: t("search.category.podcasts"),
    Voices: t("search.category.voices"),
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      onWheel={handleWheel}
      className="mb-8 scrollbar-thin flex items-center gap-2 overflow-x-auto pb-2"
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={(e) => {
            onChange(cat);
            e.currentTarget.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "nearest",
            });
          }}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95",
            active === cat
              ? "bg-brand text-brand-foreground"
              : "bg-surface-elevated text-content hover:bg-surface-overlay",
          )}
        >
          {labelMap[cat]}
        </button>
      ))}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { CATEGORIES, type Category } from "@/types/search";

interface Props {
  active: Category;
  onChange: (cat: Category) => void;
}

export function CategoryTabs({ active, onChange }: Props) {
  const { t } = useI18n();
  const labelMap: Record<Category, string> = {
    All: t("search.category.all"),
    Songs: t("search.category.songs"),
    Artists: t("search.category.artists"),
    Playlists: t("search.category.playlists"),
    Albums: t("search.category.albums"),
    Podcasts: t("search.category.podcasts"),
    Voices: t("search.category.voices"),
  };

  return (
    <div className="scrollbar-hide mb-8 flex items-center gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95",
            active === cat ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-[#333333]",
          )}
        >
          {labelMap[cat]}
        </button>
      ))}
    </div>
  );
}

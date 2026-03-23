import { cn } from "@/lib/utils";
import { CATEGORIES, Category } from "../_types";

interface Props {
  active: Category;
  onChange: (cat: Category) => void;
}

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95",
            active === cat
              ? "bg-white text-black"
              : "bg-[#2a2a2a] text-white hover:bg-[#333333]"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

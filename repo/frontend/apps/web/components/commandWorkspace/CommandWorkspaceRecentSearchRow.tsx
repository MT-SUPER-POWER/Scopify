import { Clock3, Trash2 } from "lucide-react";
import { getCommandWorkspaceSearchFilterForCategory } from "@/lib/commandWorkspace/search";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceRecentSearchRowProps } from "@/types/commandWorkspace";

export function CommandWorkspaceRecentSearchRow({
  item,
  onRemove,
  onSubmit,
  selected,
}: CommandWorkspaceRecentSearchRowProps) {
  const filter = getCommandWorkspaceSearchFilterForCategory(item.category);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3.5 py-2 transition-colors",
        selected ? "bg-white/10" : "hover:bg-white/6",
      )}
    >
      <Clock3 className="size-4 text-zinc-500" />
      <button
        type="button"
        onClick={() => onSubmit(item)}
        className="min-w-0 flex-1 truncate text-left text-sm text-zinc-200"
      >
        {item.keyword}
      </button>
      {filter ? (
        <kbd className="ml-auto rounded-md border border-white/15 bg-white/8 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300 transition-opacity group-hover:opacity-0">
          {filter.token}
        </kbd>
      ) : null}
      <button
        type="button"
        onClick={() => onRemove(item)}
        className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded p-1 text-zinc-600 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white"
        aria-label={`移除 ${item.keyword}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

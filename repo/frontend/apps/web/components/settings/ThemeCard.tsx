import { Check, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { ThemeCardProps } from "@/types/appearance";

export function ThemeCard({
  theme,
  selected,
  onSelect,
  onEdit,
  onView,
  selectionMode = false,
}: ThemeCardProps) {
  const { t } = useI18n();
  return (
    <div className="group/theme relative min-w-0">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="w-full cursor-pointer rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            "relative mb-2 block aspect-[2.1] overflow-hidden rounded-md border transition-shadow group-hover/theme:shadow-md",
            selected ? "border-brand ring-1 ring-brand" : "border-border",
          )}
          style={{ background: `linear-gradient(125deg, ${theme.top}, ${theme.bottom})` }}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/15 to-transparent"
          />
          {(onView || onEdit) && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity group-focus-within/theme:opacity-100 group-hover/theme:opacity-100"
            />
          )}
          {(selected || selectionMode) && (
            <span
              aria-hidden
              className={cn(
                "absolute top-2 left-2 flex size-5 items-center justify-center",
                selectionMode ? "rounded border border-white/70" : "rounded-full",
                selected ? "border-brand bg-brand text-black" : "bg-black/20",
              )}
            >
              {selected && <Check className="size-3" />}
            </span>
          )}
        </span>
        <span className="block truncate text-sm text-foreground" title={theme.name}>
          {theme.name}
        </span>
      </button>
      {(onView || onEdit) && (
        <button
          type="button"
          onClick={onView ?? onEdit}
          aria-label={`${t(onView ? "themeEditor.view" : "themeEditor.edit")} · ${theme.name}`}
          className="absolute top-1.5 right-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded bg-black/60 px-2 py-1.5 text-xs text-white opacity-0 transition-opacity group-focus-within/theme:opacity-100 group-hover/theme:opacity-100 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:none)]:opacity-100"
        >
          {onView ? (
            <Eye aria-hidden className="size-3.5" />
          ) : (
            <Pencil aria-hidden className="size-3.5" />
          )}
          {t(onView ? "themeEditor.view" : "themeEditor.edit")}
        </button>
      )}
    </div>
  );
}

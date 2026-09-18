import { Check, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { ThemeAssetCardProps } from "@/types/appearance-theme-editor";

export function ThemeAssetCard({
  name,
  selected,
  selectionMode = false,
  readOnly = false,
  onSelect,
  onOpen,
  preview,
}: ThemeAssetCardProps) {
  const { t } = useI18n();
  return (
    <div className="group/asset relative min-w-0">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="w-full cursor-pointer rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            "relative mb-2 block aspect-[2.1] overflow-hidden rounded-md border transition-shadow group-hover/asset:shadow-md",
            selected ? "border-brand ring-1 ring-brand" : "border-border",
          )}
        >
          {preview}
          {onOpen && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity group-focus-within/asset:opacity-100 group-hover/asset:opacity-100"
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
        <span className="block truncate text-sm text-foreground" title={name}>
          {name}
        </span>
      </button>
      {onOpen && !selectionMode && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${t(readOnly ? "themeEditor.view" : "themeEditor.edit")} · ${name}`}
          className="absolute top-1.5 right-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded bg-black/60 px-2 py-1.5 text-xs text-white opacity-0 transition-opacity group-focus-within/asset:opacity-100 group-hover/asset:opacity-100 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:none)]:opacity-100"
        >
          {readOnly ? (
            <Eye aria-hidden className="size-3.5" />
          ) : (
            <Pencil aria-hidden className="size-3.5" />
          )}
          {t(readOnly ? "themeEditor.view" : "themeEditor.edit")}
        </button>
      )}
    </div>
  );
}

"use client";

import { MoreHorizontal, Pencil, Trash2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@scopify/ui/shadcn/components/dropdown-menu";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { SubtitleThemeCardProps } from "@/types/subtitle-preview";

export function SubtitleThemeCard({
  theme,
  selected,
  managing,
  onSelect,
  onEdit,
  onUpdate,
  onDelete,
}: SubtitleThemeCardProps) {
  const { t } = useI18n();
  return (
    <div className={`min-w-0 rounded-lg border ${selected ? "border-brand" : "border-border"}`}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="w-full cursor-pointer p-3 text-left"
      >
        <span
          className="mb-2 block rounded p-3 text-lg font-semibold"
          style={{ backgroundColor: theme.settings.backgroundColor, color: theme.settings.color }}
        >
          <span
            style={
              theme.settings.colorMode === "gradient"
                ? {
                    backgroundImage: `linear-gradient(90deg, ${theme.settings.color}, ${theme.settings.gradientColor})`,
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : undefined
            }
          >
            Aa 字
          </span>
          {selected && <span className="float-right text-brand">✓</span>}
        </span>
        <span className="block truncate text-sm text-foreground" title={theme.name}>
          {theme.name}
        </span>
      </button>
      {!managing && (
        <div className="flex justify-end gap-1 border-t border-border p-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onEdit}
            aria-label={t("appearance.theme.edit")}
            title={t("appearance.theme.edit")}
          >
            <Pencil />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label={t("themeEditor.themeActions")}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onUpdate}>
                <RefreshCw />
                {t("subtitleSystem.update")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete} className="text-danger">
                <Trash2 />
                {t("subtitleSystem.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

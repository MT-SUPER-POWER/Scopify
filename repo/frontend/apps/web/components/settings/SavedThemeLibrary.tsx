"use client";

import { SETTINGS_ACTION_BUTTON_CLASS_NAME } from "@/constants/settings";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { SavedBackgroundTheme, SavedThemeLibraryProps } from "@/types/appearance";
import { ThemeCard } from "./ThemeCard";
import { ThemeBulkDeleteDialog } from "./ThemeBulkDeleteDialog";

export function SavedThemeLibrary({ activeId, onCreate, onEdit }: SavedThemeLibraryProps) {
  const { t } = useI18n();
  const themes = useAppearanceStore((state) => state.themes);
  const apply = useAppearanceStore((state) => state.applyTheme);
  const remove = useAppearanceStore((state) => state.deleteThemes);
  const [managing, setManaging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<SavedBackgroundTheme["id"][]>([]);
  const [confirming, setConfirming] = useState(false);
  const selected = themes.filter((theme) => selectedIds.includes(theme.id));
  const allSelected = themes.length > 0 && selected.length === themes.length;
  const finish = () => {
    setManaging(false);
    setSelectedIds([]);
    setConfirming(false);
  };
  const toggle = (id: SavedBackgroundTheme["id"]) =>
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-base font-medium text-foreground">{t("appearance.library.mine")}</h4>
        <div className="flex items-center gap-1">
          {managing ? (
            <Button size="sm" variant="ghost" onClick={finish}>
              {t("appearance.bulk.done")}
            </Button>
          ) : (
            <>
              <button
                type="button"
                className={SETTINGS_ACTION_BUTTON_CLASS_NAME}
                onClick={onCreate}
              >
                <Plus className="size-3.5" />
                {t("appearance.library.new")}
              </button>
              {themes.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setManaging(true)}>
                  {t("appearance.bulk.manage")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {managing && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-brand"
              checked={allSelected}
              onChange={() => setSelectedIds(allSelected ? [] : themes.map((theme) => theme.id))}
            />
            {t("appearance.bulk.all")}
          </label>
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {t("appearance.bulk.selected", { count: selected.length })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-danger"
            disabled={!selected.length}
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-3.5" />
            {t("appearance.bulk.delete", { count: selected.length })}
          </Button>
        </div>
      )}
      {themes.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={managing ? selectedIds.includes(theme.id) : activeId === theme.id}
              selectionMode={managing}
              onSelect={() => (managing ? toggle(theme.id) : apply(theme.id))}
              onEdit={managing ? undefined : () => onEdit(theme)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border px-4 py-5 text-sm">
          {t("appearance.library.empty")}
        </p>
      )}
      {confirming && (
        <ThemeBulkDeleteDialog
          themes={selected}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            remove(selected.map((theme) => theme.id));
            finish();
          }}
        />
      )}
    </div>
  );
}

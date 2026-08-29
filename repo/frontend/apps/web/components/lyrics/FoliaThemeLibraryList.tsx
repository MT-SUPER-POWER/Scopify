"use client";

import { ChevronRight, PanelLeftClose, Plus, RotateCcw } from "lucide-react";
import { useI18n } from "@/store/module/i18n";

import { FoliaThemeLibraryItem } from "@/components/lyrics/FoliaThemeLibraryItem";
import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import { createFoliaStageTheme } from "@scopify/ui/folia";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeLibraryListProps } from "@/types/components/lyrics";

export function FoliaThemeLibraryList({
  activeThemeId,
  collapsed,
  isDirty,
  onSelectTheme,
  onToggleCollapsed,
  selectedThemeId,
}: FoliaThemeLibraryListProps) {
  const { t } = useI18n();
  const restoreBuiltinThemes = useLyricStageStore((state) => state.restoreBuiltinThemes);
  const addTheme = useLyricStageStore((state) => state.addTheme);
  const themes = useLyricStageStore((state) => state.themes);
  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];

  const selectTheme = (id: string) => {
    onSelectTheme(id);
  };

  const createTheme = () => {
    const seed = themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];
    const theme = createFoliaStageTheme(String(t("folia.options.customTheme")), seed);
    addTheme(theme);
    selectTheme(theme.id);
  };

  const restoreThemes = () => {
    restoreBuiltinThemes();
    const restored = useLyricStageStore.getState().themes;
    if (!restored.some((theme) => theme.id === selectedThemeId)) {
      selectTheme(restored[0].id);
    }
  };

  if (collapsed && selectedTheme) {
    return (
      <aside className="flex h-full items-start justify-center pt-1.5">
        <button
          aria-label={String(t("folia.options.expandThemeLibrary"))}
          className="relative flex size-12 items-center justify-center rounded-full transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          onClick={onToggleCollapsed}
          title={String(t("folia.options.expandThemeLibrary"))}
          type="button"
        >
          <FoliaThemeRecord size="library" theme={selectedTheme} />
          <span className="absolute right-0 bottom-0 flex size-4 items-center justify-center rounded-full border border-white/70 bg-black/85 text-white shadow-sm">
            <ChevronRight size={10} strokeWidth={2.5} />
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{t("folia.options.themeLibrary")}</span>
        <div className="flex items-center gap-1">
          <button
            className="flex size-8 items-center justify-center rounded-lg opacity-60 transition hover:bg-white/10 hover:opacity-100 disabled:opacity-30"
            disabled={isDirty}
            onClick={restoreThemes}
            title={String(t("folia.options.restoreBuiltinThemes"))}
            type="button"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="flex size-8 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
            disabled={isDirty}
            onClick={createTheme}
            title={String(t("folia.options.createTheme"))}
            type="button"
          >
            <Plus size={15} />
          </button>
          <button
            aria-label={String(t("folia.options.collapseThemeLibrary"))}
            className="flex size-8 items-center justify-center rounded-lg opacity-60 transition hover:bg-white/10 hover:opacity-100"
            onClick={onToggleCollapsed}
            title={String(t("folia.options.collapseThemeLibrary"))}
            type="button"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className="space-y-1.5 pb-3">
          {themes.map((theme) => {
            return (
              <FoliaThemeLibraryItem
                activeThemeId={activeThemeId}
                collapsed={collapsed}
                key={theme.id}
                onSelect={() => selectTheme(theme.id)}
                selected={theme.id === selectedThemeId}
                theme={theme}
              />
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

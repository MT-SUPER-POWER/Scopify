"use client";

import { Plus, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { createFoliaStageTheme } from "@/lib/lyrics/foliaTheme";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeLibraryListProps } from "@/types/components/lyrics";

export function FoliaThemeLibraryList({
  onSelectTheme,
  selectedThemeId,
}: FoliaThemeLibraryListProps) {
  const { t } = useTranslation();
  const restoreBuiltinThemes = useLyricStageStore((state) => state.restoreBuiltinThemes);
  const addTheme = useLyricStageStore((state) => state.addTheme);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const themes = useLyricStageStore((state) => state.themes);

  const selectTheme = (id: string) => {
    setThemeId(id);
    onSelectTheme(id);
  };

  const createTheme = () => {
    const seed = themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];
    const theme = createFoliaStageTheme(String(t("options.customTheme")), seed);
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

  return (
    <aside className="flex min-h-0 flex-col rounded-[24px] border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{t("options.themeLibrary")}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={String(t("options.restoreBuiltinThemes"))}
            onClick={restoreThemes}
            className="flex size-8 items-center justify-center rounded-lg opacity-60 transition hover:bg-white/10 hover:opacity-100"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            title={String(t("options.createTheme"))}
            onClick={createTheme}
            className="flex size-8 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="min-h-0 space-y-1.5 overflow-y-auto pr-1">
        {themes.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => selectTheme(theme.id)}
              className="flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition"
              style={{
                backgroundColor: isSelected ? `${theme.dark.accentColor}18` : "transparent",
                borderColor: isSelected ? theme.dark.accentColor : "rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="size-9 shrink-0 rounded-xl border border-black/10"
                style={{
                  background: `linear-gradient(135deg, ${theme.light.backgroundColor} 0 48%, ${theme.dark.backgroundColor} 52% 100%)`,
                }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{theme.name}</span>
              <span className="flex shrink-0 gap-1">
                <i
                  className="size-2 rounded-full"
                  style={{ backgroundColor: theme.light.accentColor }}
                />
                <i
                  className="size-2 rounded-full"
                  style={{ backgroundColor: theme.dark.accentColor }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

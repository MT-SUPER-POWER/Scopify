"use client";

import { Plus, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import { createFoliaStageTheme } from "@scopify/ui/folia";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeLibraryListProps } from "@/types/components/lyrics";

export function FoliaThemeLibraryList({
  onSelectTheme,
  selectedThemeId,
}: FoliaThemeLibraryListProps) {
  const { t } = useI18n();
  const restoreBuiltinThemes = useLyricStageStore((state) => state.restoreBuiltinThemes);
  const addTheme = useLyricStageStore((state) => state.addTheme);
  const updateTheme = useLyricStageStore((state) => state.updateTheme);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const themes = useLyricStageStore((state) => state.themes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectTheme = (id: string) => {
    setThemeId(id);
    onSelectTheme(id);
  };

  const createTheme = () => {
    const seed = themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];
    const theme = createFoliaStageTheme(String(t("folia.options.customTheme")), seed);
    addTheme(theme);
    selectTheme(theme.id);
    // 新建后自动进入编辑模式
    startEditing(theme.id, theme.name);
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
    // 等 DOM 更新后聚焦
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      const theme = themes.find((item) => item.id === id);
      if (theme) {
        updateTheme({ ...theme, name: trimmed });
      }
    }
    setEditingId(null);
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
        <span className="text-sm font-semibold">{t("folia.options.themeLibrary")}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={String(t("folia.options.restoreBuiltinThemes"))}
            onClick={restoreThemes}
            className="flex size-8 items-center justify-center rounded-lg opacity-60 transition hover:bg-white/10 hover:opacity-100"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            title={String(t("folia.options.createTheme"))}
            onClick={createTheme}
            className="flex size-8 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className="space-y-1.5 pb-3">
          {themes.map((theme) => {
            const isSelected = theme.id === selectedThemeId;
            const isEditing = theme.id === editingId;
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
                <FoliaThemeRecord size="library" theme={theme} />
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(theme.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(theme.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 flex-1 truncate border-b border-white/30 bg-transparent text-sm font-medium outline-none"
                    style={{ color: theme.dark.primaryColor }}
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <span
                      className="block truncate text-sm font-medium"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditing(theme.id, theme.name);
                      }}
                    >
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="block text-[10px] opacity-50">
                        {t("folia.ui.currentTheme")}
                      </span>
                    )}
                  </div>
                )}
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
      </ScrollArea>
    </aside>
  );
}

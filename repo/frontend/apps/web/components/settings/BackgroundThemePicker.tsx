"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useThemeOptions } from "@/hooks/settings/useThemeOptions";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { SavedBackgroundTheme } from "@/types/appearance";
import { SavedThemeLibrary } from "./SavedThemeLibrary";
import { ThemeCard } from "./ThemeCard";
import { ThemeEditorDialog } from "./ThemeEditorDialog";

export function BackgroundThemePicker() {
  const { t } = useI18n();
  const { settings, palette } = useAppearanceBackground();
  const options = useThemeOptions();
  const themes = useAppearanceStore((state) => state.themes);
  const apply = useAppearanceStore((state) => state.applyTheme);
  const [editor, setEditor] = useState<SavedBackgroundTheme | null>(null);
  const createTheme = () => {
    let number = themes.length + 1;
    let name = t("appearance.theme.untitled", { number });
    while (themes.some((theme) => theme.name === name))
      name = t("appearance.theme.untitled", { number: ++number });
    setEditor({
      id: `user:${crypto.randomUUID()}`,
      name,
      top: palette.top,
      bottom: palette.bottom,
      intensity: settings.intensity,
      height: settings.height,
    });
  };
  return (
    <div className="mb-8 space-y-7">
      <fieldset>
        <legend className="mb-4 text-base font-medium text-foreground">
          {t("appearance.library.builtin")}
        </legend>
        <div className="grid grid-cols-3 gap-x-4 gap-y-5">
          {options
            .filter((theme) => !theme.id.startsWith("user:"))
            .map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={palette.id === theme.id}
                onSelect={() => apply(theme.id)}
              />
            ))}
          <button
            type="button"
            onClick={createTheme}
            className="group flex cursor-pointer flex-col items-start text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="mb-2 flex aspect-[2.1] w-full items-center justify-center rounded-md border border-dashed border-input group-hover:border-content-muted">
              <Plus aria-hidden className="size-5" />
            </span>
            {t("appearance.library.new")}
          </button>
        </div>
      </fieldset>
      <SavedThemeLibrary activeId={palette.id} onCreate={createTheme} onEdit={setEditor} />
      {editor && (
        <ThemeEditorDialog
          key={editor.id}
          theme={editor}
          isNew={!themes.some((theme) => theme.id === editor.id)}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}

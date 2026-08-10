"use client";

import { Moon, Plus, RotateCcw, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { FoliaThemeColorEditor } from "@/components/lyrics/FoliaThemeColorEditor";
import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import {
  createFoliaStageTheme,
  getFoliaStageTheme,
  isBuiltinFoliaStageTheme,
} from "@/lib/lyrics/foliaTheme";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaStageTheme, FoliaThemeColors } from "@/types/foliaStage";

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function DesktopPlaybackThemeControls() {
  const { t } = useI18n();
  const settings = useLyricStageStore();
  const activeTheme = getFoliaStageTheme(settings.themes, settings.themeId);
  const [draftTheme, setDraftTheme] = useState(activeTheme);
  const isBuiltin = isBuiltinFoliaStageTheme(activeTheme.id);

  useEffect(() => setDraftTheme(activeTheme), [activeTheme]);

  const updateDraftTheme = (nextTheme: FoliaStageTheme) => {
    setDraftTheme(nextTheme);
    if (hasValidThemeColors(nextTheme.light) && hasValidThemeColors(nextTheme.dark)) {
      settings.updateTheme(nextTheme);
    }
  };

  const createTheme = () => {
    const nextTheme = createFoliaStageTheme(String(t("folia.options.customTheme")), activeTheme);
    settings.addTheme(nextTheme);
    settings.setThemeId(nextTheme.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FoliaThemeRecord theme={activeTheme} />
        <select
          aria-label={t("folia.options.themePresets")}
          className="border-border bg-surface-overlay text-content h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus:border-current"
          onChange={(event) => settings.setThemeId(event.currentTarget.value)}
          value={settings.themeId}
        >
          {settings.themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label={t("folia.options.createTheme")}
          title={t("folia.options.createTheme")}
          className="border-border text-content-muted hover:bg-surface-overlay hover:text-content flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors"
          onClick={createTheme}
        >
          <Plus className="size-4" />
        </button>
        {isBuiltin ? (
          <button
            type="button"
            aria-label={t("folia.options.resetTheme")}
            title={t("folia.options.resetTheme")}
            className="border-border text-content-muted hover:bg-surface-overlay hover:text-content flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors"
            onClick={() => settings.resetTheme(activeTheme.id)}
          >
            <RotateCcw className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="bg-surface-overlay grid grid-cols-2 gap-1 rounded-lg p-1">
        {(
          [
            ["dark", Moon, "folia.options.darkTheme"],
            ["light", Sun, "folia.options.lightTheme"],
          ] as const
        ).map(([variant, Icon, labelKey]) => (
          <button
            key={variant}
            type="button"
            aria-pressed={settings.themeVariant === variant}
            className={cn(
              "flex h-8 items-center justify-center gap-2 rounded-md text-xs transition-colors",
              settings.themeVariant === variant
                ? "bg-content/12 text-content font-medium"
                : "text-content-muted hover:text-content",
            )}
            onClick={() => settings.setThemeVariant(variant)}
          >
            <Icon className="size-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      <FoliaThemeColorEditor
        onDraftChange={updateDraftTheme}
        theme={draftTheme}
        variant={settings.themeVariant}
      />
    </div>
  );
}

function hasValidThemeColors(colors: FoliaThemeColors) {
  return Object.values(colors).every((color) => HEX_COLOR_PATTERN.test(color));
}

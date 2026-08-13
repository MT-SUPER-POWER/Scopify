"use client";

import { Moon, Sun } from "lucide-react";

import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import { getFoliaStageTheme } from "@/lib/lyrics/foliaTheme";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";

export function DesktopPlaybackThemeControls() {
  const { t } = useI18n();
  const settings = useLyricStageStore();
  const activeTheme = getFoliaStageTheme(settings.themes, settings.themeId);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <FoliaThemeRecord theme={activeTheme} />
        <select
          aria-label={t("folia.options.themePresets")}
          className="desktop-controller-field h-9 min-w-0 flex-1 rounded-xl px-3 text-xs transition"
          onChange={(event) => settings.setThemeId(event.currentTarget.value)}
          value={settings.themeId}
        >
          {settings.themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      <div className="desktop-controller-segment grid grid-cols-2 gap-1 rounded-xl p-1">
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
            className="desktop-controller-segment-button flex h-8 items-center justify-center gap-2 rounded-lg text-xs font-medium transition"
            data-active={settings.themeVariant === variant}
            onClick={() => settings.setThemeVariant(variant)}
          >
            <Icon className="size-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

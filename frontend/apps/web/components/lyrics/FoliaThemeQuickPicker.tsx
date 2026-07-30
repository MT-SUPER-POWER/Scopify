"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeQuickPickerProps } from "@/types/components/lyrics";

export function FoliaThemeQuickPicker({ onOpenThemeLibrary, theme }: FoliaThemeQuickPickerProps) {
  const { t } = useI18n();
  const themeId = useLyricStageStore((state) => state.themeId);
  const themeRecentIds = useLyricStageStore((state) => state.themeRecentIds);
  const themes = useLyricStageStore((state) => state.themes);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const setThemeVariant = useLyricStageStore((state) => state.setThemeVariant);
  const isDaylight = themeVariant === "light";
  const quickThemes = useMemo(() => {
    const selectedTheme = themes.find((item) => item.id === themeId);
    const recentThemes = themeRecentIds
      .map((id) => themes.find((item) => item.id === id))
      .filter((item): item is (typeof themes)[number] => Boolean(item));
    const fallbackThemes = themes.filter((item) => item.id !== themeId);

    return [selectedTheme, ...recentThemes, ...fallbackThemes]
      .filter((item): item is (typeof themes)[number] => Boolean(item))
      .filter((item, index, items) => items.findIndex(({ id }) => id === item.id) === index)
      .slice(0, 5);
  }, [themeId, themeRecentIds, themes]);

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
          {t("folia.options.themePresets")}
        </span>
        <button
          type="button"
          title={String(t("folia.options.openThemePark"))}
          onClick={onOpenThemeLibrary}
          className="rounded-md p-1 opacity-55 transition-all hover:bg-white/10 hover:opacity-100"
          style={{ color: theme.primaryColor }}
        >
          <Palette size={14} />
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        <div
          className={`flex shrink-0 rounded-lg p-0.5 ${isDaylight ? "bg-black/5" : "bg-black/20"}`}
        >
          {(
            [
              ["light", Sun, "folia.options.lightTheme"],
              ["dark", Moon, "folia.options.darkTheme"],
            ] as const
          ).map(([variant, Icon, label]) => (
            <button
              key={variant}
              type="button"
              title={String(t(label))}
              aria-label={String(t(label))}
              aria-pressed={themeVariant === variant}
              onClick={() => setThemeVariant(variant)}
              className={`flex size-6 items-center justify-center rounded-md transition-all ${
                themeVariant === variant
                  ? isDaylight
                    ? "bg-white shadow-sm"
                    : "bg-white/20 shadow-sm"
                  : "opacity-45 hover:opacity-100"
              }`}
              style={{ color: theme.primaryColor }}
            >
              <Icon size={12} />
            </button>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-5 justify-items-center gap-1 overflow-hidden">
          {quickThemes.map((item) => {
            const isActive = item.id === themeId;
            return (
              <button
                key={item.id}
                type="button"
                title={item.name}
                aria-label={item.name}
                aria-pressed={isActive}
                onClick={() => setThemeId(item.id)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-105"
                style={{
                  borderColor: isActive ? item[themeVariant].primaryColor : "transparent",
                }}
              >
                <FoliaThemeRecord theme={item} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

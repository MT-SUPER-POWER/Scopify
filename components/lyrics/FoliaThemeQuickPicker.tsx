"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeQuickPickerProps } from "@/types/components/lyrics";

export function FoliaThemeQuickPicker({ onOpenThemeLibrary, theme }: FoliaThemeQuickPickerProps) {
  const { t } = useTranslation();
  const themeId = useLyricStageStore((state) => state.themeId);
  const themes = useLyricStageStore((state) => state.themes);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const setThemeVariant = useLyricStageStore((state) => state.setThemeVariant);
  const isDaylight = themeVariant === "light";

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
          {t("options.themePresets")}
        </span>
        <button
          type="button"
          title={String(t("options.openThemePark"))}
          onClick={onOpenThemeLibrary}
          className="rounded-md p-1 opacity-55 transition-all hover:bg-white/10 hover:opacity-100"
          style={{ color: theme.primaryColor }}
        >
          <Palette size={14} />
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div
          className={`flex shrink-0 rounded-lg p-0.5 ${isDaylight ? "bg-black/5" : "bg-black/20"}`}
        >
          {(
            [
              ["light", Sun, "options.lightTheme"],
              ["dark", Moon, "options.darkTheme"],
            ] as const
          ).map(([variant, Icon, label]) => (
            <button
              key={variant}
              type="button"
              title={String(t(label))}
              aria-label={String(t(label))}
              aria-pressed={themeVariant === variant}
              onClick={() => setThemeVariant(variant)}
              className={`flex size-7 items-center justify-center rounded-md transition-all ${
                themeVariant === variant
                  ? isDaylight
                    ? "bg-white shadow-sm"
                    : "bg-white/20 shadow-sm"
                  : "opacity-45 hover:opacity-100"
              }`}
              style={{ color: theme.primaryColor }}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 [scrollbar-width:none] gap-1.5 overflow-x-auto pb-0.5">
          {themes.map((item) => {
            const isActive = item.id === themeId;
            const colors = item[themeVariant];
            return (
              <button
                key={item.id}
                type="button"
                title={item.name}
                aria-label={item.name}
                aria-pressed={isActive}
                onClick={() => setThemeId(item.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border transition-transform hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${item.light.accentColor} 0 48%, ${item.dark.accentColor} 52% 100%)`,
                  borderColor: isActive ? colors.primaryColor : `${colors.primaryColor}30`,
                  boxShadow: isActive ? `0 0 0 2px ${colors.accentColor}` : undefined,
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: colors.backgroundColor }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

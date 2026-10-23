"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { useMemo } from "react";
import {
  FoliaIconButton,
  FoliaSegments,
} from "@scopify/ui/scopify/components/folia-panel/controls";

import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";

// The controls tab's theme group, laid out as Folia's (panelTab/controls/ThemeSourceRow.tsx +
// ThemeNameRow.tsx): the themes to switch between, then the theme in use with light or dark and
// the way into the theme library. Scopify's themes are a library rather than default / AI / custom
// sources, so the first line holds the recent themes as swatches.

export function FoliaPanelTheme({ onOpenThemeLibrary }: { onOpenThemeLibrary: () => void }) {
  const { t } = useI18n();
  const themeId = useLyricStageStore((state) => state.themeId);
  const themeRecentIds = useLyricStageStore((state) => state.themeRecentIds);
  const themes = useLyricStageStore((state) => state.themes);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const setThemeVariant = useLyricStageStore((state) => state.setThemeVariant);
  const selectedTheme = themes.find((item) => item.id === themeId);
  const quickThemes = useMemo(() => {
    const recentThemes = themeRecentIds
      .map((id) => themes.find((item) => item.id === id))
      .filter((item): item is (typeof themes)[number] => Boolean(item));
    return [selectedTheme, ...recentThemes, ...themes]
      .filter((item): item is (typeof themes)[number] => Boolean(item))
      .filter((item, index, items) => items.findIndex(({ id }) => id === item.id) === index)
      .slice(0, 6);
  }, [selectedTheme, themeRecentIds, themes]);

  return (
    <div>
      <div className="flex min-h-11 items-center gap-1.5 px-1 py-1.5">
        <div className="grid min-w-0 flex-1 grid-cols-6 justify-items-center gap-1">
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
                className={`st-t-fast grid size-8 place-items-center rounded-full transition-[box-shadow,scale] active:scale-94 ${isActive ? "shadow-[0_0_0_2px_var(--st-accent)]" : "hover:shadow-[0_0_0_2px_var(--st-line2)]"}`}
              >
                <FoliaThemeRecord theme={item} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 px-1 py-1.5">
        <span className="min-w-0 flex-[1_1_72px] truncate text-[13px] text-[color:var(--st-t2)]">
          {selectedTheme?.name ?? t("folia.options.themePresets")}
        </span>
        <span className="ml-auto flex max-w-full items-center gap-1.5">
          <FoliaSegments
            size="s"
            value={themeVariant}
            onChange={setThemeVariant}
            options={[
              {
                icon: <Sun size={15} />,
                iconOnly: true,
                label: t("folia.options.lightTheme"),
                value: "light",
              },
              {
                icon: <Moon size={15} />,
                iconOnly: true,
                label: t("folia.options.darkTheme"),
                value: "dark",
              },
            ]}
          />
          <FoliaIconButton
            size="s"
            filled
            label={t("folia.options.openThemePark")}
            onClick={onOpenThemeLibrary}
          >
            <Palette size={15} />
          </FoliaIconButton>
        </span>
      </div>
    </div>
  );
}

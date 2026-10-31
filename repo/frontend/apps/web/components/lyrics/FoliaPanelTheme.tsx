"use client";

import { ChevronLeft, ChevronRight, Moon, Palette, Sun } from "lucide-react";
import {
  FoliaIconButton,
  FoliaSegments,
} from "@scopify/ui/scopify/components/folia-panel/controls";

import { useFoliaThemeCarousel } from "@/hooks/lyrics/useFoliaThemeCarousel";
import type { FoliaPanelThemeProps } from "@/types/lyrics/components";
import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import { useTranslation } from "react-i18next";

import { useLyricStageStore } from "@/store/module/lyrics";

// Theme name and appearance first, then the complete library as a horizontally scrollable row.
// Library order stays stable while the selected swatch is brought into view.

export function FoliaPanelTheme({ onOpenThemeLibrary }: FoliaPanelThemeProps) {
  const { t } = useTranslation();
  const themeId = useLyricStageStore((state) => state.themeId);
  const themes = useLyricStageStore((state) => state.themes);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const setThemeVariant = useLyricStageStore((state) => state.setThemeVariant);
  const selectedTheme = themes.find((item) => item.id === themeId);
  const carousel = useFoliaThemeCarousel(themeId, themes.length);

  return (
    <div>
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
      <div className="flex min-h-11 items-center gap-1 py-1.5">
        {carousel.overflowing ? (
          <FoliaIconButton
            size="s"
            label={t("folia.ui.previousMode")}
            disabled={!carousel.canPrevious}
            onClick={() => carousel.scroll(-1)}
          >
            <ChevronLeft size={14} />
          </FoliaIconButton>
        ) : null}
        <div
          ref={carousel.ref}
          className="hide-scrollbar flex min-w-0 flex-1 gap-3 overflow-x-auto overscroll-x-contain p-1"
        >
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.name}
              aria-label={item.name}
              data-selected={item.id === themeId || undefined}
              aria-pressed={item.id === themeId}
              onClick={() => setThemeId(item.id)}
              className={`st-t-fast grid size-8 shrink-0 place-items-center rounded-full transition-[box-shadow,scale] active:scale-94 ${item.id === themeId ? "shadow-[0_0_0_2px_var(--st-accent)]" : "hover:shadow-[0_0_0_2px_var(--st-line2)]"}`}
            >
              <FoliaThemeRecord theme={item} />
            </button>
          ))}
        </div>
        {carousel.overflowing ? (
          <FoliaIconButton
            size="s"
            label={t("folia.ui.nextMode")}
            disabled={!carousel.canNext}
            onClick={() => carousel.scroll(1)}
          >
            <ChevronRight size={14} />
          </FoliaIconButton>
        ) : null}
      </div>
    </div>
  );
}

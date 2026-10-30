"use client";

import { useCallback, useMemo } from "react";
import {
  FoliaPictureGrid,
  type FoliaPictureState,
} from "@scopify/ui/scopify/components/folia-panel/picture-grid";
import { FoliaBackgroundModeGlyph } from "@/components/lyrics/FoliaModeGlyph";
import { FoliaBackgroundThumbnail } from "@/components/lyrics/FoliaBackgroundThumbnail";
import {
  VISUALIZER_BACKGROUND_REGISTRY,
  getVisualizerBackgroundModeLabel,
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import type { VisualizerBackgroundMode } from "@/components/lyrics/folia/src/types";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import type { FoliaBackgroundShelfProps } from "@/types/lyrics/folia/visualSettings";

export function FoliaBackgroundShelf({ theme, onSectionChange }: FoliaBackgroundShelfProps) {
  const { t } = useI18n();
  const compact = useMediaQuery("(max-width: 639px)");
  const currentMode = useLyricStageStore(
    (state) => state.background.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE,
  );
  const setBackgroundMode = useLyricStageStore((state) => state.setBackgroundMode);

  const options = useMemo(
    () =>
      VISUALIZER_BACKGROUND_REGISTRY.map((entry) => ({
        value: entry.mode,
        label: getVisualizerBackgroundModeLabel(entry.mode, t),
      })),
    [t],
  );

  const picture = useCallback(
    (value: string, state: FoliaPictureState) => (
      <span
        className="relative grid size-full place-items-center overflow-hidden"
        style={{ backgroundColor: theme.backgroundColor, color: theme.secondaryColor }}
      >
        {state.visible ? (
          <FoliaBackgroundThumbnail mode={value as VisualizerBackgroundMode} theme={theme} />
        ) : (
          <FoliaBackgroundModeGlyph mode={value as VisualizerBackgroundMode} size={28} />
        )}
      </span>
    ),
    [theme],
  );

  return (
    <div className="flex h-60 min-h-0 shrink-0 flex-col gap-2 lg:h-auto lg:flex-1 lg:shrink">
      <div className="flex items-center gap-2 px-1 text-xs text-[color:var(--st-t2)]">
        <span className="font-semibold">{t("folia.options.visualizerBackgroundMode")}</span>
        <span className="text-[color:var(--st-t3)]">{options.length}</span>
      </div>
      <FoliaPictureGrid
        value={currentMode}
        options={options}
        columns={compact ? 4 : 7}
        picture={picture}
        label={t("folia.options.visualizerBackgroundMode")}
        className="folia-style-shelf flex-1"
        onChange={(value) => {
          setBackgroundMode(value as VisualizerBackgroundMode);
          onSectionChange("background");
        }}
      />
    </div>
  );
}

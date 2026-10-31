"use client";

import { useCallback, useMemo } from "react";
import { Shuffle } from "lucide-react";
import {
  FoliaPictureGrid,
  type FoliaPictureState,
} from "@scopify/ui/scopify/components/folia-panel/picture-grid";
import { FoliaVisualizerModeGlyph } from "@/components/lyrics/FoliaModeGlyph";
import { FoliaStyleThumbnail } from "@/components/lyrics/FoliaStyleThumbnail";
import {
  VISUALIZER_REGISTRY,
  getVisualizerModeLabel,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useTranslation } from "react-i18next";

import type { FoliaStyleShelfProps } from "@/types/lyrics/folia/visualSettings";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";

export function FoliaStyleShelf({ assets, theme, onSectionChange }: FoliaStyleShelfProps) {
  const { t } = useTranslation();
  const compact = useMediaQuery("(max-width: 639px)");
  const mode = useLyricStageStore((state) => state.mode);
  const random = useLyricStageStore((state) => state.randomVisualizerMode);
  const patchSettings = useLyricStageStore((state) => state.patchSettings);
  const requestMode = useLyricStageStore((state) => state.requestVisualizerMode);
  const options = useMemo(
    () => [
      ...VISUALIZER_REGISTRY.map((entry) => ({
        value: entry.mode,
        label: getVisualizerModeLabel(entry.mode, t),
      })),
      { value: "__random__", label: t("folia.options.randomVisualizerMode") },
    ],
    [t],
  );
  const picture = useCallback(
    (value: string, state: FoliaPictureState) => (
      <span
        className="relative grid size-full place-items-center"
        style={{ backgroundColor: theme.backgroundColor, color: theme.secondaryColor }}
      >
        {value === "__random__" ? (
          <Shuffle size={28} />
        ) : state.visible ? (
          <FoliaStyleThumbnail mode={value} theme={theme} assets={assets} />
        ) : (
          <FoliaVisualizerModeGlyph mode={value} size={24} />
        )}
      </span>
    ),
    [assets, theme],
  );
  return (
    <div className="flex h-60 min-h-0 shrink-0 flex-col gap-2 lg:h-auto lg:flex-1 lg:shrink">
      <div className="flex items-center gap-2 px-1 text-xs text-[color:var(--st-t2)]">
        <span className="font-semibold">{t("folia.options.visualizerMode")}</span>
        <span className="text-[color:var(--st-t3)]">{options.length}</span>
      </div>
      <FoliaPictureGrid
        value={random ? "__random__" : mode}
        options={options}
        columns={compact ? 4 : 7}
        picture={picture}
        label={t("folia.options.visualizerMode")}
        className="folia-style-shelf flex-1"
        onChange={(value) => {
          if (value === "__random__") patchSettings({ randomVisualizerMode: true });
          else {
            patchSettings({ randomVisualizerMode: false });
            requestMode(value as typeof mode);
          }
          onSectionChange("visualizer");
        }}
      />
    </div>
  );
}

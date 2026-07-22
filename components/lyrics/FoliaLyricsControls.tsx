"use client";

import { Layers, Palette, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FoliaQuickEffectPicker } from "@/components/lyrics/FoliaQuickEffectPicker";
import {
  getVisualizerBackgroundModeLabel,
  VISUALIZER_BACKGROUND_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import {
  getVisualizerModeLabel,
  VISUALIZER_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import type { FoliaLyricsControlsProps } from "@/types/components/lyrics";
import type { LyricVisualizerMode } from "@/types/lyrics";

function isLyricVisualizerMode(mode: string): mode is LyricVisualizerMode {
  return (
    mode === "cadenza" ||
    mode === "cappella" ||
    mode === "claddagh" ||
    mode === "classic" ||
    mode === "diorama" ||
    mode === "fume" ||
    mode === "monet" ||
    mode === "partita" ||
    mode === "tilt"
  );
}

export function FoliaLyricsControls({ onOpenSettings, theme }: FoliaLyricsControlsProps) {
  const { t } = useTranslation();
  const model = useFoliaPanelControls();
  const isDaylight = theme.name === "Daylight Default";
  const activeOptionBg = isDaylight
    ? "bg-white shadow-sm hover:bg-white/90"
    : "bg-white/20 shadow-sm hover:bg-white/30";
  const visualizerOptions = VISUALIZER_REGISTRY.flatMap((entry) =>
    isLyricVisualizerMode(entry.mode)
      ? [
          {
            label: getVisualizerModeLabel(entry.mode, (key) => String(t(key))),
            value: entry.mode,
          },
        ]
      : [],
  );
  const backgroundOptions = VISUALIZER_BACKGROUND_REGISTRY.map((entry) => ({
    label: getVisualizerBackgroundModeLabel(entry.mode, (key) => String(t(key))),
    value: entry.mode,
  }));
  const isMonetFullOverlay = model.monetBackgroundTuning.backgroundLayout === "full-overlay";
  const monetLayoutLabel = t(
    isMonetFullOverlay ? "options.monetLayoutFullOverlay" : "options.monetLayoutHalfPane",
  );
  const latentDisplayLabel = t(
    `options.latentDisplay${
      model.latentBackgroundTuning.displayMode === "dithering"
        ? "Dithering"
        : model.latentBackgroundTuning.displayMode === "mesh"
          ? "Mesh"
          : "Both"
    }`,
  );

  return (
    <div className="space-y-4">
      <section className="space-y-3 border-b border-white/5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenSettings("visualizer")}
            className="min-w-0 text-left text-[10px] font-bold tracking-widest uppercase opacity-55 transition-opacity hover:opacity-100"
            title={String(t("options.openLyricsStyleSettings"))}
          >
            {t("options.lyricsRenderer")}
          </button>
          <span className="flex shrink-0 items-center gap-1">
            <FoliaQuickEffectPicker
              ariaLabel={String(t("options.lyricsRenderer"))}
              isDaylight={isDaylight}
              onChange={model.setVisualizerMode}
              options={visualizerOptions}
              primaryColor={theme.primaryColor}
              value={model.visualizerMode}
            />
            <button
              type="button"
              title={String(t("options.openLyricsStyleSettings"))}
              aria-label={String(t("options.openLyricsStyleSettings"))}
              onClick={() => onOpenSettings("visualizer")}
              className="rounded-md p-1 opacity-55 transition-opacity hover:bg-white/10 hover:opacity-100"
            >
              <Settings2 size={14} />
            </button>
          </span>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenSettings("background")}
            className="min-w-0 text-left text-[10px] font-bold tracking-widest uppercase opacity-55 transition-opacity hover:opacity-100"
            title={String(t("options.previewBackgroundSettings"))}
          >
            {t("ui.background")}
          </button>
          <span className="flex shrink-0 items-center gap-1">
            <FoliaQuickEffectPicker
              ariaLabel={String(t("options.visualizerBackgroundMode"))}
              isDaylight={isDaylight}
              onChange={model.setVisualizerBackgroundMode}
              options={backgroundOptions}
              primaryColor={theme.primaryColor}
              value={model.visualizerBackgroundMode}
            />
            {model.visualizerBackgroundMode === "common" ? (
              <button
                type="button"
                title={String(t("options.useCoverColorBg"))}
                aria-label={String(t("options.useCoverColorBg"))}
                aria-pressed={model.useCoverColorBg}
                onClick={model.toggleCoverColorBackground}
                className={`rounded-md p-1 transition-colors ${
                  model.useCoverColorBg
                    ? "text-blue-300"
                    : "opacity-55 hover:bg-white/10 hover:opacity-100"
                }`}
              >
                <Palette size={14} />
              </button>
            ) : null}
            {model.visualizerBackgroundMode === "monet" ? (
              <button
                type="button"
                title={`${t("options.monetBackgroundLayout")}: ${monetLayoutLabel}`}
                aria-label={`${t("options.monetBackgroundLayout")}: ${monetLayoutLabel}`}
                aria-pressed={isMonetFullOverlay}
                onClick={model.toggleMonetBackgroundLayout}
                className={`rounded-md px-1.5 py-1 text-[10px] font-bold transition-all ${activeOptionBg}`}
              >
                {monetLayoutLabel}
              </button>
            ) : null}
            {model.visualizerBackgroundMode === "nomand" ? (
              <button
                type="button"
                title={String(t("options.nomandBackgroundOverlay"))}
                aria-label={String(t("options.nomandBackgroundOverlay"))}
                aria-pressed={model.nomandBackgroundTuning.overlayEnabled}
                onClick={model.toggleNomandBackgroundOverlay}
                className={`rounded-md p-1 transition-colors ${
                  model.nomandBackgroundTuning.overlayEnabled
                    ? "text-blue-300"
                    : "opacity-55 hover:bg-white/10 hover:opacity-100"
                }`}
              >
                <Layers size={14} />
              </button>
            ) : null}
            {model.visualizerBackgroundMode === "latent" ? (
              <>
                <button
                  type="button"
                  title={`${t("options.latentDisplayMode")}: ${latentDisplayLabel}`}
                  aria-label={`${t("options.latentDisplayMode")}: ${latentDisplayLabel}`}
                  onClick={model.cycleLatentBackgroundDisplayMode}
                  className={`rounded-md px-1.5 py-1 text-[10px] font-bold transition-all ${activeOptionBg}`}
                >
                  {latentDisplayLabel}
                </button>
                <button
                  type="button"
                  title={String(t("options.nomandBackgroundOverlay"))}
                  aria-label={String(t("options.nomandBackgroundOverlay"))}
                  aria-pressed={model.latentBackgroundTuning.overlayEnabled}
                  onClick={model.toggleLatentBackgroundOverlay}
                  className={`rounded-md p-1 transition-colors ${
                    model.latentBackgroundTuning.overlayEnabled
                      ? "text-blue-300"
                      : "opacity-55 hover:bg-white/10 hover:opacity-100"
                  }`}
                >
                  <Layers size={14} />
                </button>
              </>
            ) : null}
            <button
              type="button"
              title={String(t("options.previewBackgroundSettings"))}
              aria-label={String(t("options.previewBackgroundSettings"))}
              onClick={() => onOpenSettings("background")}
              className="rounded-md p-1 opacity-55 transition-opacity hover:bg-white/10 hover:opacity-100"
            >
              <Settings2 size={14} />
            </button>
          </span>
        </div>
      </section>
    </div>
  );
}

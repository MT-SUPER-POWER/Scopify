"use client";

import { Cone, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Theme } from "@/components/lyrics/folia/src/types";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";

interface FoliaBackgroundQuickControlProps {
  isDaylight: boolean;
  theme: Theme;
}

export function FoliaBackgroundQuickControl({
  isDaylight,
  theme,
}: FoliaBackgroundQuickControlProps) {
  const { t } = useTranslation();
  const model = useFoliaPanelControls();
  const activeOptionBg = isDaylight
    ? "bg-white shadow-sm hover:bg-white/90"
    : "bg-white/20 shadow-sm hover:bg-white/30";
  const iconButtonClass =
    "rounded-md p-1 opacity-55 transition-all hover:bg-white/10 hover:opacity-100";

  if (model.visualizerBackgroundMode === "common") {
    return (
      <button
        aria-pressed={model.useCoverColorBg}
        className={`${iconButtonClass} ${model.useCoverColorBg ? "text-blue-400 opacity-100" : ""}`}
        onClick={model.toggleCoverColorBackground}
        style={{ color: model.useCoverColorBg ? undefined : theme.primaryColor }}
        title={String(t(model.useCoverColorBg ? "theme.addCoverColor" : "theme.useDefaultColor"))}
        type="button"
      >
        <Cone size={14} />
      </button>
    );
  }

  if (model.visualizerBackgroundMode === "monet") {
    const isFullOverlay = model.monetBackgroundTuning.backgroundLayout === "full-overlay";
    const label = String(
      t(isFullOverlay ? "options.monetLayoutFullOverlay" : "options.monetLayoutHalfPane"),
    );
    return (
      <button
        aria-label={`${t("options.monetBackgroundLayout")}: ${label}`}
        aria-pressed={isFullOverlay}
        className={`rounded-md px-1.5 py-1 text-[10px] font-bold transition-all ${activeOptionBg}`}
        onClick={model.toggleMonetBackgroundLayout}
        style={{ color: theme.primaryColor }}
        title={`${t("options.monetBackgroundLayout")}: ${label}`}
        type="button"
      >
        {label}
      </button>
    );
  }

  if (model.visualizerBackgroundMode === "nomand") {
    return (
      <button
        aria-label={String(t("options.nomandBackgroundOverlay"))}
        aria-pressed={model.nomandBackgroundTuning.overlayEnabled}
        className={`${iconButtonClass} ${model.nomandBackgroundTuning.overlayEnabled ? "text-blue-400 opacity-100" : ""}`}
        onClick={model.toggleNomandBackgroundOverlay}
        style={{
          color: model.nomandBackgroundTuning.overlayEnabled ? undefined : theme.primaryColor,
        }}
        title={String(t("options.nomandBackgroundOverlay"))}
        type="button"
      >
        <Layers size={14} />
      </button>
    );
  }

  if (model.visualizerBackgroundMode === "latent") {
    const displayMode = model.latentBackgroundTuning.displayMode;
    const label = String(
      t(
        `options.latentDisplay${
          displayMode === "dithering" ? "Dithering" : displayMode === "mesh" ? "Mesh" : "Both"
        }`,
      ),
    );
    return (
      <button
        aria-label={`${t("options.latentDisplayMode")}: ${label}`}
        className={`rounded-md px-1.5 py-1 text-[10px] font-bold transition-all ${activeOptionBg}`}
        onClick={model.cycleLatentBackgroundDisplayMode}
        style={{ color: theme.primaryColor }}
        title={`${t("options.latentDisplayMode")}: ${label}`}
        type="button"
      >
        {label}
      </button>
    );
  }

  return null;
}

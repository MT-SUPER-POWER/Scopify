import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { NomandBackgroundSource, NomandBackgroundTuning } from "../../../../types";
import { EFFECT_LABEL_KEYS, EFFECTS } from "./NomandBackgroundEffectSettings";
import React, { lazy } from "react";
import { Layers } from "lucide-react";
import { DEFAULT_NOMAND_BACKGROUND_TUNING } from "../../../../types";
import NomandBackgroundSettingsCard from "./NomandBackgroundSettingsCard";
import { defineVisualizerBackground } from "../definition";

const NomandBackgroundLayer = lazy(() => import("./NomandBackgroundLayer"));

// src/components/visualizer/backgrounds/nomand/entry.tsx
// Registers the Paper image-effect shell background.

const SOURCE_LABEL_KEYS: Record<NomandBackgroundSource, string> = {
  "cover-derived": "options.monetBackgroundSourceCover",
  "uploaded-global": "options.monetBackgroundSourceUploaded",
};

export default defineVisualizerBackground({
  mode: "nomand",
  order: 30,
  labelKey: "folia.options.visualizerBackgroundModeNomand",
  labelFallback: "Nomand",
  render: ({ config, coverUrl, theme, isDaylight }) => (
    <NomandBackgroundLayer
      coverUrl={coverUrl}
      monetBackgroundImage={config?.customImage}
      tuning={config?.nomand?.tuning}
      theme={theme}
      isDaylight={isDaylight}
    />
  ),
  renderSettingsPanel: ({ config, actions, ...props }) => (
    <NomandBackgroundSettingsCard
      {...props}
      tuning={config?.nomand?.tuning ?? DEFAULT_NOMAND_BACKGROUND_TUNING}
      onTuningChange={actions?.nomand?.onTuningChange}
      monetBackgroundImage={config?.customImage}
      onUploadMonetBackgroundImage={actions?.customImage?.onUpload}
      onClearMonetBackgroundImage={actions?.customImage?.onClear}
      isLoadingMonetBackgroundImage={actions?.customImage?.isLoading}
    />
  ),
  renderQuickControls: ({ config, actions, t }) => {
    const tuning = config?.nomand?.tuning ?? DEFAULT_NOMAND_BACKGROUND_TUNING;
    const change = (patch: Partial<NomandBackgroundTuning>) =>
      actions?.nomand?.onTuningChange?.(patch);
    const source = tuning.imageSource;
    const sourceLabel = t(SOURCE_LABEL_KEYS[source]);
    // The other source is the uploaded picture (the one 莫奈 uses too): without one the chip only says 封面.
    const hasImage = Boolean(config?.customImage);
    const effectLabel = t(EFFECT_LABEL_KEYS[tuning.effect]);

    return (
      <>
        <FoliaQuickChip
          label={sourceLabel}
          title={`${t("options.nomandBackgroundSource")}: ${sourceLabel}`}
          disabled={!hasImage && source === "cover-derived"}
          onClick={() =>
            change({
              imageSource:
                hasImage && source === "cover-derived" ? "uploaded-global" : "cover-derived",
            })
          }
        />
        <FoliaQuickChip
          label={effectLabel}
          title={`${t("options.nomandBackgroundEffect")}: ${effectLabel}`}
          onClick={() => change({ effect: getSteppedMode(EFFECTS, tuning.effect, 1) })}
        />
        <FoliaQuickToggle
          active={tuning.overlayEnabled}
          label={t("options.nomandBackgroundOverlay")}
          onToggle={() => change({ overlayEnabled: !tuning.overlayEnabled })}
        >
          <Layers size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: (actions) => actions?.nomand?.onResetTuning?.(),
});

import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import type { MonetBackgroundSource, MonetBackgroundTuning } from "../../../../types";
import type { TranslationKey } from "@/lib/i18n";
import React, { lazy } from "react";
import { Columns3, Wind } from "lucide-react";
import { DEFAULT_MONET_BACKGROUND_TUNING } from "../../../../types";
import { MonetBackgroundSettingsCard } from "./MonetBackgroundSettingsCard";
import { defineVisualizerBackground } from "../definition";

const MonetBackgroundLayer = lazy(() => import("./MonetBackgroundLayer"));

// src/components/visualizer/backgrounds/monet/entry.tsx
// Registers the Monet image-treatment shell background.

const SOURCE_LABEL_KEYS: Record<MonetBackgroundSource, TranslationKey> = {
  "cover-derived": "folia.options.monetBackgroundSourceCover",
  "uploaded-global": "folia.options.monetBackgroundSourceUploaded",
};

export default defineVisualizerBackground({
  mode: "monet",
  order: 20,
  labelKey: "folia.options.visualizerBackgroundModeMonet",
  labelFallback: "Monet",
  render: ({ config, coverUrl, theme, isDaylight, staticMode }) => (
    <MonetBackgroundLayer
      coverUrl={coverUrl}
      monetBackgroundImage={config?.customImage}
      theme={theme}
      isDaylight={isDaylight}
      tuning={config?.monet?.tuning}
      transparentBackground={config?.transparent}
      staticMode={staticMode}
    />
  ),
  renderSettingsPanel: ({
    config,
    actions,
    t,
    isDaylight,
    theme,
    controlCardBg,
    rangeInputClass,
    onSliderPointerDown,
    onSliderCommit,
  }) => (
    <MonetBackgroundSettingsCard
      t={t}
      isDaylight={isDaylight}
      theme={theme}
      controlCardBg={controlCardBg}
      rangeInputClass={rangeInputClass}
      tuning={config?.monet?.tuning ?? DEFAULT_MONET_BACKGROUND_TUNING}
      onTuningChange={actions?.monet?.onTuningChange}
      monetBackgroundImage={config?.customImage}
      onUploadMonetBackgroundImage={actions?.customImage?.onUpload}
      onClearMonetBackgroundImage={actions?.customImage?.onClear}
      isLoadingMonetBackgroundImage={actions?.customImage?.isLoading}
      onSliderPointerDown={onSliderPointerDown}
      onSliderCommit={onSliderCommit}
    />
  ),
  renderQuickControls: ({ config, actions, t }) => {
    const tuning = config?.monet?.tuning ?? DEFAULT_MONET_BACKGROUND_TUNING;
    const isFullOverlay = tuning.backgroundLayout === "full-overlay";
    const layoutLabel = t(
      isFullOverlay ? "folia.options.monetLayoutFullOverlay" : "folia.options.monetLayoutHalfPane",
    );
    const change = (patch: Partial<MonetBackgroundTuning>) =>
      actions?.monet?.onTuningChange?.(patch);
    const source = tuning.backgroundSource;
    const sourceLabel = t(SOURCE_LABEL_KEYS[source]);
    // The other source is the uploaded picture: without one the chip only says 封面 (the settings window uploads).
    const hasImage = Boolean(config?.customImage);

    return (
      <>
        <FoliaQuickChip
          label={layoutLabel}
          title={`${t("folia.options.monetBackgroundLayout")}: ${layoutLabel}`}
          onClick={() =>
            change({
              backgroundLayout: isFullOverlay ? "half-pane-gradient" : "full-overlay",
            })
          }
        />
        <FoliaQuickChip
          label={sourceLabel}
          title={`${t("folia.options.monetBackgroundSource")}: ${sourceLabel}`}
          disabled={!hasImage && source === "cover-derived"}
          onClick={() =>
            change({
              backgroundSource:
                hasImage && source === "cover-derived" ? "uploaded-global" : "cover-derived",
            })
          }
        />
        <FoliaQuickToggle
          active={tuning.backgroundStreaksEnabled}
          label={t("folia.options.monetBackgroundStreaksEnabled")}
          onToggle={() => change({ backgroundStreaksEnabled: !tuning.backgroundStreaksEnabled })}
        >
          <Columns3 size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={tuning.backgroundDriftEnabled}
          label={t("folia.options.monetBackgroundDriftEnabled")}
          onToggle={() => change({ backgroundDriftEnabled: !tuning.backgroundDriftEnabled })}
        >
          <Wind size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: (actions) => actions?.monet?.onResetTuning?.(),
});

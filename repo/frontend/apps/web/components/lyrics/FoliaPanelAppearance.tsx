"use client";

import { useMemo, useRef, useState } from "react";
import { FoliaQuickChip } from "@scopify/ui/scopify/components/folia-panel/controls";
import {
  FoliaModeStepperRow,
  getSteppedMode,
} from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";

import { FoliaBackgroundQuickControl } from "@/components/lyrics/FoliaBackgroundQuickControl";

import {
  getVisualizerBackgroundModeLabel,
  getVisualizerBackgroundRegistryEntry,
  VISUALIZER_BACKGROUND_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import {
  getVisualizerRegistryEntry,
  getVisualizerModeLabel,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import type { VisualizerBackgroundMode } from "@/components/lyrics/folia/src/types";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import { useFoliaRandomPool } from "@/hooks/lyrics/useFoliaRandomPool";
import { useTranslation } from "react-i18next";

import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaStageEditSection } from "@/types/lyrics/folia/stage";
import type { LyricVisualizerMode } from "@/types/lyrics/model";

// The controls tab's appearance group (Folia panelTab/controls/AppearanceSection.tsx): the lyric
// style and background rows. Each is "‹ glyph caption/mode⌄ ›"; the middle opens every mode as a
// picture. Choosing 随机 for the style makes the line under it the style this song drew (press to
// draw another) and the pool chip, which opens the pool as switchable tiles.
// Folia draws live frozen previews in the pictures; until those exist here each picture shows the
// mode's glyph, which is also what Folia shows before an image is ready.

import type { FoliaPanelAppearanceProps } from "@/types/lyrics/components";
import { INTENSITY_VISUALIZER_MODES } from "@/constants/foliaPanel";
import {
  drawStyleGlyph,
  drawStylePicture,
  drawBackgroundGlyph,
  drawBackgroundPicture,
} from "@/components/lyrics/FoliaPanelModePictures";
import { FoliaRandomPoolPopover } from "@/components/lyrics/FoliaRandomPoolPopover";
import { FoliaVisualizerQuickControl } from "@/components/lyrics/FoliaVisualizerQuickControl";

const RANDOM_CHOICE = "__random__";

export function FoliaPanelAppearance({
  assets,
  onClosePanel,
  onOpenSettings,
  theme,
}: FoliaPanelAppearanceProps) {
  const { t } = useTranslation();
  const model = useFoliaPanelControls();
  const randomEnabled = useLyricStageStore((state) => state.randomVisualizerMode);
  const pool = useFoliaRandomPool();
  const [openPicker, setOpenPicker] = useState<"style" | "pool" | "background" | null>(null);
  const poolChipRef = useRef<HTMLButtonElement>(null);
  const isDaylight = theme.name === "snow";

  const styleOptions = useMemo(
    () => [...pool.options, { label: t("folia.ui.visualizerRandom"), value: RANDOM_CHOICE }],
    [pool.options, t],
  );
  const styleValues = useMemo(() => styleOptions.map((option) => option.value), [styleOptions]);
  const backgroundOptions = useMemo(
    () =>
      VISUALIZER_BACKGROUND_REGISTRY.map((entry) => ({
        label: getVisualizerBackgroundModeLabel(entry.mode, t),
        value: entry.mode,
      })),
    [t],
  );
  const backgroundValues = backgroundOptions.map((option) => option.value);
  const styleValue = randomEnabled ? RANDOM_CHOICE : model.visualizerMode;
  const supportsIntensity = INTENSITY_VISUALIZER_MODES.has(model.visualizerMode);

  const selectStyle = (choice: string) => {
    const stage = useLyricStageStore.getState();
    if (choice === RANDOM_CHOICE) {
      stage.patchSettings({ randomVisualizerMode: true });
      return;
    }
    if (stage.randomVisualizerMode) stage.patchSettings({ randomVisualizerMode: false });
    stage.requestVisualizerMode(choice as LyricVisualizerMode);
  };

  const openSettings = (section: FoliaStageEditSection) => {
    setOpenPicker(null);
    onOpenSettings(section);
  };

  return (
    <div>
      <FoliaModeStepperRow<string>
        value={styleValue}
        inlineParams={randomEnabled}
        options={styleOptions}
        onSelect={selectStyle}
        onStep={(direction) => selectStyle(getSteppedMode(styleValues, styleValue, direction))}
        renderGlyph={drawStyleGlyph}
        renderPicture={drawStylePicture}
        caption={t("folia.ui.animationMode")}
        stepLabels={{ next: t("folia.ui.nextMode"), previous: t("folia.ui.previousMode") }}
        moreLabel={t("folia.ui.moreSettings")}
        onOpenMore={() => openSettings("visualizer")}
        open={openPicker === "style"}
        onOpenChange={(open) => setOpenPicker(open ? "style" : null)}
        aside={
          supportsIntensity ? (
            <FoliaQuickChip
              label={t(`folia.animation.${model.animationIntensity}`)}
              title={`${t("folia.options.animationIntensity")}: ${t(`folia.animation.${model.animationIntensity}`)}`}
              onClick={model.cycleAnimationIntensity}
            />
          ) : null
        }
        params={
          randomEnabled ? (
            <>
              <FoliaQuickChip
                label={getVisualizerModeLabel(model.visualizerMode, t)}
                title={`${t("folia.options.randomVisualizerReroll")}: ${getVisualizerModeLabel(model.visualizerMode, t)}`}
                disabled={!pool.canReroll}
                onClick={pool.reroll}
              />
              <FoliaQuickChip
                buttonRef={poolChipRef}
                expanded={openPicker === "pool"}
                label={t("folia.options.randomPoolChoose")}
                title={`${t("folia.options.randomPoolChoose")}: ${pool.countLabel}`}
                onClick={() => setOpenPicker(openPicker === "pool" ? null : "pool")}
              />
            </>
          ) : getVisualizerRegistryEntry(model.visualizerMode).renderQuickControls ? (
            <FoliaVisualizerQuickControl
              assets={assets}
              onClosePanel={onClosePanel}
              theme={theme}
            />
          ) : null
        }
      />

      <FoliaRandomPoolPopover
        anchorRef={poolChipRef}
        open={randomEnabled && openPicker === "pool"}
        pool={pool}
        onClose={() => setOpenPicker(null)}
        onOpenMore={() => openSettings("visualizer")}
      />

      <FoliaModeStepperRow<VisualizerBackgroundMode>
        value={model.visualizerBackgroundMode}
        options={backgroundOptions}
        onSelect={model.setVisualizerBackgroundMode}
        onStep={(direction) =>
          model.setVisualizerBackgroundMode(
            getSteppedMode(backgroundValues, model.visualizerBackgroundMode, direction),
          )
        }
        renderGlyph={drawBackgroundGlyph}
        renderPicture={drawBackgroundPicture}
        caption={t("folia.options.visualizerBackgroundMode")}
        stepLabels={{ next: t("folia.ui.nextMode"), previous: t("folia.ui.previousMode") }}
        moreLabel={t("folia.ui.moreSettings")}
        onOpenMore={() => openSettings("background")}
        open={openPicker === "background"}
        onOpenChange={(open) => setOpenPicker(open ? "background" : null)}
        params={
          getVisualizerBackgroundRegistryEntry(model.visualizerBackgroundMode)
            .renderQuickControls ? (
            <FoliaBackgroundQuickControl assets={assets} isDaylight={isDaylight} theme={theme} />
          ) : null
        }
      />
    </div>
  );
}

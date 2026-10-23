"use client";

import { Shuffle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { FoliaQuickChip } from "@scopify/ui/scopify/components/folia-panel/controls";
import {
  FoliaModeStepperRow,
  FoliaPickerMoreButton,
  getSteppedMode,
} from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import { FoliaPictureChecks } from "@scopify/ui/scopify/components/folia-panel/picture-grid";
import { FoliaPopover } from "@scopify/ui/scopify/components/folia-panel/popover";

import { FoliaBackgroundQuickControl } from "@/components/lyrics/FoliaBackgroundQuickControl";
import {
  FoliaBackgroundModeGlyph,
  FoliaVisualizerModeGlyph,
} from "@/components/lyrics/FoliaModeGlyph";
import {
  getVisualizerBackgroundModeLabel,
  getVisualizerBackgroundRegistryEntry,
  VISUALIZER_BACKGROUND_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import { getVisualizerModeLabel } from "@/components/lyrics/folia/src/components/visualizer/registry";
import type { Theme, VisualizerBackgroundMode } from "@/components/lyrics/folia/src/types";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import { useFoliaRandomPool } from "@/hooks/lyrics/useFoliaRandomPool";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaStageEditSection } from "@/types/foliaStage";
import type { LyricVisualizerMode } from "@/types/lyrics";

// The controls tab's appearance group (Folia panelTab/controls/AppearanceSection.tsx): the lyric
// style and background rows. Each is "‹ glyph caption/mode⌄ ›"; the middle opens every mode as a
// picture. Choosing 随机 for the style makes the line under it the style this song drew (press to
// draw another) and the pool chip, which opens the pool as switchable tiles.
// Folia draws live frozen previews in the pictures; until those exist here each picture shows the
// mode's glyph, which is also what Folia shows before an image is ready.

const RANDOM_CHOICE = "__random__";

const INTENSITY_VISUALIZER_MODES = new Set<string>([
  "classic",
  "cadenza",
  "partita",
  "fume",
  "monet",
  "cappella",
  "claddagh",
  "diorama",
  "pendolo",
  "sonnet",
]);

const drawStyleGlyph = (mode: string) =>
  mode === RANDOM_CHOICE ? (
    <Shuffle size={18} />
  ) : (
    <FoliaVisualizerModeGlyph mode={mode} size={18} />
  );

const drawStylePicture = (mode: string) => (
  <span
    className={`grid size-full place-items-center ${mode === RANDOM_CHOICE ? "text-[color:var(--st-accent)]" : "text-[color:var(--st-t2)]"}`}
  >
    {mode === RANDOM_CHOICE ? (
      <Shuffle size={28} />
    ) : (
      <FoliaVisualizerModeGlyph mode={mode} size={30} />
    )}
  </span>
);

const drawPoolPicture = (mode: string) => (
  <span className="grid size-full place-items-center text-[color:var(--st-t2)]">
    <FoliaVisualizerModeGlyph mode={mode} size={22} />
  </span>
);

const drawBackgroundGlyph = (mode: VisualizerBackgroundMode) => (
  <FoliaBackgroundModeGlyph mode={mode} size={18} />
);

const drawBackgroundPicture = (mode: VisualizerBackgroundMode) => (
  <span className="grid size-full place-items-center text-[color:var(--st-t2)]">
    <FoliaBackgroundModeGlyph mode={mode} size={30} />
  </span>
);

interface FoliaPanelAppearanceProps {
  onOpenSettings: (section: FoliaStageEditSection) => void;
  theme: Theme;
}

export function FoliaPanelAppearance({ onOpenSettings, theme }: FoliaPanelAppearanceProps) {
  const { t } = useI18n();
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
          ) : null
        }
      />

      <FoliaPopover
        anchorRef={poolChipRef}
        open={randomEnabled && openPicker === "pool"}
        onClose={() => setOpenPicker(null)}
        fill
        aria-label={t("folia.options.randomPool")}
        className="flex flex-col rounded-[14px] pt-2 pb-1"
      >
        <div className="mb-1 flex min-h-7 shrink-0 items-center justify-between gap-3 pr-3 pl-4">
          <span className="text-[13px] leading-5 font-semibold text-[color:var(--st-t2)]">
            {t("folia.options.randomPool")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-[color:var(--st-t3)]">{pool.countLabel}</span>
            <button
              type="button"
              disabled={pool.allOn}
              onClick={pool.selectAll}
              className="st-t-fast h-7 rounded-lg px-2 text-xs text-[color:var(--st-t2)] transition-colors enabled:hover:bg-[var(--st-fill)] enabled:hover:text-[color:var(--st-t1)] disabled:opacity-40"
            >
              {t("folia.options.randomVisualizerSelectAll")}
            </button>
          </span>
        </div>
        <div className="flex min-h-0 flex-col">
          <FoliaPictureChecks
            value={pool.modes}
            options={pool.options}
            picture={drawPoolPicture}
            columns={4}
            compact
            onChange={pool.setModes}
            least={1}
            onRefuse={pool.refuse}
            label={t("folia.options.randomPool")}
            maxHeight={300}
          />
        </div>
        <FoliaPickerMoreButton
          label={t("folia.ui.moreSettings")}
          onClose={() => setOpenPicker(null)}
          onOpenMore={() => openSettings("visualizer")}
        />
      </FoliaPopover>

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
            <FoliaBackgroundQuickControl isDaylight={isDaylight} theme={theme} />
          ) : null
        }
      />
    </div>
  );
}

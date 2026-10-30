import React from "react";
import { FoliaQuickChip } from "@scopify/ui/scopify/components/folia-panel/controls";
import type { TranslationKey } from "@/lib/i18n";
import { DEFAULT_NEBBIA_TUNING, type NebbiaTuning } from "../../../types";
import { defineVisualizer } from "../definition";
import NebbiaSettingsPanel, {
  NEBBIA_APPEAR_LABEL_KEYS,
  NEBBIA_FADE_LABEL_KEYS,
} from "./NebbiaSettingsPanel";

const VisualizerNebbia = React.lazy(() => import("./VisualizerNebbia"));

// src/components/visualizer/nebbia/entry.tsx
// Registers 雾笺 (Nebbia): writing lyrics with a fingertip on the fogged-up window of a bus on a rainy night.
// Each character is written stroke by stroke in its stroke order and wipes the fog clear onto the city
// outside; beads gather along the wipe, drops run down, the fog creeps back. Raindrops hit the glass with
// the vocal, and two spotlights from the street follow the character being sung.
// Folia's smart-beat effect 疏雨轻车 (rain on the vocal stem, jolts on the kicks) needs its htdemucs
// stem analysis, which Scopify does not have, so the rain follows the 1-3.5 kHz band of the mix and the
// bus jolts at random, as upstream does until a track is analysed.

// 播放页的两个小按钮按这几组常用搭配轮换（设置里可以随意组合；不是其中哪一组时显示「自定义」）
const APPEAR_PRESETS: { appear: NebbiaTuning["appear"]; labelKey: TranslationKey }[] = [
  { appear: ["write", "fade"], labelKey: "folia.options.nebbiaAppearAuto" },
  { appear: ["write"], labelKey: NEBBIA_APPEAR_LABEL_KEYS.write },
  { appear: ["fade"], labelKey: NEBBIA_APPEAR_LABEL_KEYS.fade },
  { appear: ["fade", "breath"], labelKey: NEBBIA_APPEAR_LABEL_KEYS.breath },
];
const FADE_PRESETS: { fade: NebbiaTuning["fade"]; labelKey: TranslationKey }[] = [
  { fade: ["fog"], labelKey: NEBBIA_FADE_LABEL_KEYS.fog },
  { fade: ["fingers"], labelKey: NEBBIA_FADE_LABEL_KEYS.fingers },
  { fade: ["fog", "fingers"], labelKey: "folia.options.nebbiaFadeMix" },
];
/** 当前搭配在预设里的位置；不在里面是 -1。 */
const presetIndex = (
  presets: { labelKey: string }[],
  pick: (i: number) => readonly string[],
  on: readonly string[],
) => presets.findIndex((_, i) => pick(i).join() === on.join());

export default defineVisualizer({
  mode: "nebbia",
  order: 29,
  labelKey: "folia.ui.visualizerNebbia",
  labelFallback: "雾笺",
  previewSeed: "nebbia",
  previewStartOffset: 0,
  tuningKind: "nebbia",
  // Deliberately unkeyed on the seed: the runtime takes a track change in place (createNebbiaRuntime.ts).
  render: (props) => (
    <VisualizerNebbia {...props} nebbiaTuning={props.nebbiaTuning ?? DEFAULT_NEBBIA_TUNING} />
  ),
  renderSettingsPanel: (props) => <NebbiaSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.nebbiaTuning ?? DEFAULT_NEBBIA_TUNING;
    const onTuningChange = (patch: Partial<NebbiaTuning>) => props.onNebbiaTuningChange?.(patch);
    const ai = presetIndex(APPEAR_PRESETS, (i) => APPEAR_PRESETS[i]!.appear, tuning.appear);
    const fi = presetIndex(FADE_PRESETS, (i) => FADE_PRESETS[i]!.fade, tuning.fade);
    const appear = t(ai >= 0 ? APPEAR_PRESETS[ai]!.labelKey : "folia.options.nebbiaCustom");
    const fade = t(fi >= 0 ? FADE_PRESETS[fi]!.labelKey : "folia.options.nebbiaCustom");
    return (
      <>
        <FoliaQuickChip
          label={appear}
          title={`${t("folia.options.nebbiaAppear")}: ${appear}`}
          onClick={() =>
            onTuningChange({ appear: APPEAR_PRESETS[(ai + 1) % APPEAR_PRESETS.length]!.appear })
          }
        />
        <FoliaQuickChip
          label={fade}
          title={`${t("folia.options.nebbiaFade")}: ${fade}`}
          onClick={() =>
            onTuningChange({ fade: FADE_PRESETS[(fi + 1) % FADE_PRESETS.length]!.fade })
          }
        />
      </>
    );
  },
  resetSettings: ({ resetNebbiaTuning, setDraftNebbiaTuning }) => {
    setDraftNebbiaTuning?.(DEFAULT_NEBBIA_TUNING);
    resetNebbiaTuning?.();
  },
});

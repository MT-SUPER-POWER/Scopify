"use client";

import { useTranslation } from "react-i18next";

import { useLyricStageStore } from "@/store/module/lyrics";
import { getVisualizerRegistryEntry } from "@/components/lyrics/folia/src/components/visualizer/registry";
import type { VisualizerSettingsPanelProps } from "@/components/lyrics/folia/src/components/visualizer/definition";
import type { FoliaVisualizerQuickControlProps } from "@/types/lyrics/components";

export function FoliaVisualizerQuickControl({
  assets,
  onClosePanel,
  theme,
}: FoliaVisualizerQuickControlProps) {
  const { t } = useTranslation();
  const settings = useLyricStageStore();
  const props: VisualizerSettingsPanelProps = {
    t,
    cappellaCustomAvatarImages: assets.cappellaCustomAvatarImages,
    theme,
    isDaylight: theme.name === "snow",
    controlCardBg: "",
    rangeInputClass: "",
    classicTuning: settings.tunings.classic,
    onClassicTuningChange: (patch) => settings.patchTuning("classic", patch),
    partitaTuning: settings.tunings.partita,
    onPartitaTuningChange: (patch) => settings.patchTuning("partita", patch),
    fumeTuning: settings.tunings.fume,
    onFumeTuningChange: (patch) => settings.patchTuning("fume", patch),
    claddaghTuning: settings.tunings.claddagh,
    onCladdaghTuningChange: (patch) => settings.patchTuning("claddagh", patch),
    cappellaTuning: settings.tunings.cappella,
    onCappellaTuningChange: (patch) => settings.patchTuning("cappella", patch),
    tiltTuning: settings.tunings.tilt,
    onTiltTuningChange: (patch) => settings.patchTuning("tilt", patch),
    monetTuning: settings.tunings.monet,
    onMonetTuningChange: (patch) => settings.patchTuning("monet", patch),
    dioramaTuning: settings.tunings.diorama,
    onDioramaTuningChange: (patch) => settings.patchTuning("diorama", patch),
    pendoloTuning: settings.tunings.pendolo,
    onPendoloTuningChange: (patch) => settings.patchTuning("pendolo", patch),
    sonnetTuning: settings.tunings.sonnet,
    onSonnetTuningChange: (patch) => settings.patchTuning("sonnet", patch),
    temperaTuning: settings.tunings.tempera,
    onTemperaTuningChange: (patch) => settings.patchTuning("tempera", patch),
    hanabiTuning: settings.tunings.hanabi,
    onHanabiTuningChange: (patch) => settings.patchTuning("hanabi", patch),
    machiTuning: settings.tunings.machi,
    onMachiTuningChange: (patch) => settings.patchTuning("machi", patch),
    nebbiaTuning: settings.tunings.nebbia,
    onNebbiaTuningChange: (patch) => settings.patchTuning("nebbia", patch),
    onClosePanel,
  };
  return getVisualizerRegistryEntry(settings.mode).renderQuickControls?.(props);
}

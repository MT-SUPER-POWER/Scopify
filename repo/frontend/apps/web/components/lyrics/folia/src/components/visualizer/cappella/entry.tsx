import { Smile } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { TranslationKey } from "@/lib/i18n";
import type { CappellaAvatarSource, CappellaTuning } from "../../../types";
import { DEFAULT_CAPPELLA_TUNING } from "../../../types";
import React, { lazy } from "react";
import { defineVisualizer } from "../definition";
import { CappellaSettingsPanel } from "../settingsPanels";

const VisualizerCappella = lazy(() => import("./VisualizerCappella"));

// src/components/visualizer/cappella/entry.tsx
// Registers the Cappella chat visualizer mode.
const AVATAR_SOURCES: CappellaAvatarSource[] = ["cover", "builtin", "color", "custom"];
const AVATAR_SOURCE_LABEL_KEYS: Record<CappellaAvatarSource, TranslationKey> = {
  cover: "folia.options.cappellaAvatarSourceCover",
  builtin: "folia.options.cappellaAvatarSourceBuiltin",
  color: "folia.options.cappellaAvatarSourceColor",
  custom: "folia.options.cappellaAvatarSourceCustom",
};

export default defineVisualizer({
  mode: "cappella",
  order: 50,
  labelKey: "folia.ui.visualizerCappella",
  labelFallback: "Cappella",
  previewSeed: "cappella",
  previewStartOffset: 0,
  tuningKind: "cappella",
  render: (props) => <VisualizerCappella {...props} />,
  renderSettingsPanel: (props) => <CappellaSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.cappellaTuning ?? DEFAULT_CAPPELLA_TUNING;
    const onTuningChange = (patch: Partial<CappellaTuning>) =>
      props.onCappellaTuningChange?.(patch);

    const avatarLabel = t(AVATAR_SOURCE_LABEL_KEYS[tuning.avatarSource]);
    const cycleAvatarSource = () => {
      const hasCustom = (props.cappellaCustomAvatarImages?.length ?? 0) > 0;
      const sources = hasCustom
        ? AVATAR_SOURCES
        : AVATAR_SOURCES.filter((source) => source !== "custom");
      onTuningChange({ avatarSource: getSteppedMode(sources, tuning.avatarSource, 1) });
    };
    return (
      <>
        <FoliaQuickChip
          label={avatarLabel}
          title={`${t("folia.options.cappellaAvatarSource")}: ${avatarLabel}`}
          onClick={cycleAvatarSource}
        />
        <FoliaQuickToggle
          active={tuning.showEmoMessages}
          label={t("folia.options.cappellaShowEmoMessages")}
          onToggle={() => onTuningChange({ showEmoMessages: !tuning.showEmoMessages })}
        >
          <Smile size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: (props) => {
    props.resetCappellaTuning?.();
  },
});

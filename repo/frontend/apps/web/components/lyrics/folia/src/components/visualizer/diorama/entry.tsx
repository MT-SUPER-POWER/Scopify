import { Ghost, Highlighter } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import type { DioramaTuning } from "../../../types";
import { DEFAULT_DIORAMA_TUNING } from "../../../types";
import React, { lazy } from "react";
import { defineVisualizer } from "../definition";
import { DioramaSettingsPanel } from "../settingsPanels";

const VisualizerDiorama = lazy(() => import("./VisualizerDiorama"));

// src/components/visualizer/diorama/entry.tsx
// Registers Diorama: a procedural 3D lyric flythrough with lyric-synced cinematic camera work, plus
// its tuning panel (camera speed / motion amount / geometry visibility and response / particles).
export default defineVisualizer({
  mode: "diorama",
  order: 60,
  labelKey: "folia.ui.visualizerDiorama",
  labelFallback: "镜台",
  previewSeed: "diorama",
  previewStartOffset: 0,
  tuningKind: "diorama",
  render: (props) => <VisualizerDiorama {...props} />,
  renderSettingsPanel: (props) => <DioramaSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.dioramaTuning ?? DEFAULT_DIORAMA_TUNING;
    const onTuningChange = (patch: Partial<DioramaTuning>) => props.onDioramaTuningChange?.(patch);
    return (
      <>
        <FoliaQuickToggle
          active={tuning.keywordColoringEnabled}
          label={t("folia.options.dioramaKeywordColoring")}
          onToggle={() =>
            onTuningChange({ keywordColoringEnabled: !tuning.keywordColoringEnabled })
          }
        >
          <Highlighter size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={tuning.soulEnabled}
          label={t("folia.options.dioramaSoulEffect")}
          onToggle={() => onTuningChange({ soulEnabled: !tuning.soulEnabled })}
        >
          <Ghost size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: ({ resetDioramaTuning }) => {
    resetDioramaTuning?.();
  },
});

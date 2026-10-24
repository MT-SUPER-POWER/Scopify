import { Frame, Sparkles } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import React from "react";
import { DEFAULT_HANABI_TUNING, type HanabiTuning } from "../../../types";
import { defineVisualizer } from "../definition";
import HanabiSettingsPanel from "./HanabiSettingsPanel";

const VisualizerHanabi = React.lazy(() => import("./VisualizerHanabi"));

// src/components/visualizer/hanabi/entry.tsx
// Registers 花火, the Japanese lyric-PV director: lyrics pop in on bright colour blocks, fireworks
// and MG stickers bloom along the words, and the whole world keeps rising shot after shot like a
// fireworks show. Folia's beat effects (随拍开花 / 随拍推镜) need its beat_this clock, which
// Scopify does not have, so they are left out.
export default defineVisualizer({
  mode: "hanabi",
  order: 26,
  labelKey: "folia.ui.visualizerHanabi",
  labelFallback: "花火",
  previewSeed: "hanabi",
  previewStartOffset: 0,
  tuningKind: "hanabi",
  // Deliberately unkeyed on the seed: the runtime hands a track change over in place
  // (useVisualizerSongCommit / useVisualizerPixiHost) instead of throwing the WebGL context away.
  render: (props) => <VisualizerHanabi {...props} />,
  renderSettingsPanel: (props) => <HanabiSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.hanabiTuning ?? DEFAULT_HANABI_TUNING;
    const onTuningChange = (patch: Partial<HanabiTuning>) => props.onHanabiTuningChange?.(patch);
    return (
      <>
        <FoliaQuickToggle
          active={tuning.overlayFrame}
          label={t("folia.options.hanabiOverlayFrame")}
          onToggle={() => onTuningChange({ overlayFrame: !tuning.overlayFrame })}
        >
          <Frame size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={tuning.collage > 0}
          label={t("folia.options.hanabiCollage")}
          onToggle={() => onTuningChange({ collage: tuning.collage > 0 ? 0 : 1 })}
        >
          <Sparkles size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: ({ resetHanabiTuning, setDraftHanabiTuning }) => {
    setDraftHanabiTuning?.(DEFAULT_HANABI_TUNING);
    resetHanabiTuning?.();
  },
});

import React, { useSyncExternalStore } from "react";
import { Camera, Orbit } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import {
  DEFAULT_MACHI_TUNING,
  MACHI_CAMERA_MODES,
  MACHI_TIMES_OF_DAY,
  MACHI_WEATHERS,
  type MachiTuning,
} from "../../../types";
import { defineVisualizer } from "../definition";
import { isMachiCameraBarOpen, subscribeMachiCameraBar, toggleMachiCameraBar } from "./cameraBar";
import { MACHI_CAMERA_LABEL_KEYS } from "./cameraControls";
import MachiSettingsPanel, {
  MACHI_SCENE_CHOICES,
  MACHI_SCENE_LABEL_KEYS,
  MACHI_TIME_LABEL_KEYS,
  MACHI_WEATHER_LABEL_KEYS,
} from "./MachiSettingsPanel";

const VisualizerMachi = React.lazy(() => import("./VisualizerMachi"));

// src/components/visualizer/machi/entry.tsx
// Registers 町景 (Machi), an experimental three.js style: procedural miniature dioramas of a Japanese town (a
// convenience-store street corner, a petrol-station car park, a Kowloon bar) whose signs carry the lyrics — the
// current line lit up word by word on an LED screen, the next line on an LED ticker, the song on the shop signs.
// The scene, time of day and weather are tuning (each can be "auto"), and so are a pinned camera view per scene, a
// slow camera drift and the depth of field; the theme's colours and icons repaint the "chain". The panel's camera
// button opens a viewfinder bar on the player page (MachiCameraBar) to frame the shot there.
// Folia's smart-beat effects (霓虹随拍 / 鼓点涟漪 / 大屏闪拍) need its beat_this clock and drum-stem analysis,
// which Scopify does not have, so they are left out and the scene always draws as if they were off.

const cycleValue = <T,>(choices: readonly T[], current: T): T =>
  choices[(choices.indexOf(current) + 1) % choices.length]!;

/** 控制面板里的摄影机按钮：开关播放页上的取景控制条，打开时收起面板，让出画面。 */
const MachiCameraBarButton: React.FC<{ label: string; onClosePanel?: () => void }> = ({
  label,
  onClosePanel,
}) => {
  const open = useSyncExternalStore(
    subscribeMachiCameraBar,
    isMachiCameraBarOpen,
    isMachiCameraBarOpen,
  );
  return (
    <FoliaQuickToggle
      active={open}
      label={label}
      onToggle={() => {
        toggleMachiCameraBar();
        if (!open) onClosePanel?.();
      }}
    >
      <Camera size={14} />
    </FoliaQuickToggle>
  );
};

export default defineVisualizer({
  mode: "machi",
  order: 27,
  labelKey: "folia.ui.visualizerMachi",
  labelFallback: "町景",
  previewSeed: "machi",
  previewStartOffset: 0,
  tuningKind: "machi",
  // Deliberately unkeyed on the seed: the runtime takes a track change in place (useVisualizerPixiHost).
  render: (props) => (
    <VisualizerMachi {...props} machiTuning={props.machiTuning ?? DEFAULT_MACHI_TUNING} />
  ),
  renderSettingsPanel: (props) => <MachiSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t, onClosePanel } = props;
    const tuning = props.machiTuning ?? DEFAULT_MACHI_TUNING;
    const onTuningChange = (patch: Partial<MachiTuning>) => props.onMachiTuningChange?.(patch);
    const scene = t(MACHI_SCENE_LABEL_KEYS[tuning.scene]);
    const time = t(MACHI_TIME_LABEL_KEYS[tuning.timeOfDay]);
    const weather = t(MACHI_WEATHER_LABEL_KEYS[tuning.weather]);
    const camera = t(MACHI_CAMERA_LABEL_KEYS[tuning.camera]);
    return (
      <>
        <FoliaQuickChip
          label={scene}
          title={`${t("folia.options.machiScene")}: ${scene}`}
          onClick={() => onTuningChange({ scene: cycleValue(MACHI_SCENE_CHOICES, tuning.scene) })}
        />
        <FoliaQuickChip
          label={time}
          title={`${t("folia.options.machiTimeOfDay")}: ${time}`}
          onClick={() =>
            onTuningChange({ timeOfDay: cycleValue(MACHI_TIMES_OF_DAY, tuning.timeOfDay) })
          }
        />
        <FoliaQuickChip
          label={weather}
          title={`${t("folia.options.machiWeather")}: ${weather}`}
          onClick={() => onTuningChange({ weather: cycleValue(MACHI_WEATHERS, tuning.weather) })}
        />
        {/* 拖到想要的视角再点它：切到自定义视角时，刚拖过的视角就固定下来。 */}
        <FoliaQuickChip
          label={camera}
          title={`${t("folia.options.machiCameraMode")}: ${camera}`}
          onClick={() => onTuningChange({ camera: cycleValue(MACHI_CAMERA_MODES, tuning.camera) })}
        />
        <FoliaQuickToggle
          active={tuning.motion}
          label={t("folia.options.machiCameraMotion")}
          onToggle={() => onTuningChange({ motion: !tuning.motion })}
        >
          <Orbit size={14} />
        </FoliaQuickToggle>
        <MachiCameraBarButton
          label={t("folia.options.machiCameraBar")}
          onClosePanel={onClosePanel}
        />
      </>
    );
  },
  resetSettings: ({ resetMachiTuning, setDraftMachiTuning }) => {
    setDraftMachiTuning?.(DEFAULT_MACHI_TUNING);
    resetMachiTuning?.();
  },
});

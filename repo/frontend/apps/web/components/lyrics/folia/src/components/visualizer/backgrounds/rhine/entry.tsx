import { lazy } from "react";
import { defineVisualizerBackground } from "../definition";
import RhineBackgroundSettingsCard from "@/components/lyrics/rhine/RhineBackgroundSettingsCard";
import { RhineBackgroundQuickControls } from "@/components/lyrics/rhine/RhineBackgroundQuickControls";

const RhineBackground = lazy(() => import("@/components/lyrics/rhine/RhineBackground"));

export default defineVisualizerBackground({
  mode: "rhine",
  order: 60,
  labelKey: "folia.options.visualizerBackgroundModeRhine",
  labelFallback: "Rhine",
  render: (props) => <RhineBackground {...props} />,
  renderSettingsPanel: (props) => <RhineBackgroundSettingsCard {...props} />,
  renderQuickControls: (props) => <RhineBackgroundQuickControls {...props} />,
  resetSettings: (actions) => actions?.rhine?.onResetTuning?.(),
});

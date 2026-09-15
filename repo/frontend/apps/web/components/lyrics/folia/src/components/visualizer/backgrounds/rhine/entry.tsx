import { lazy } from "react";
import { defineVisualizerBackground } from "../definition";
import RhineBackgroundSettingsCard from "@/components/lyrics/rhine/RhineBackgroundSettingsCard";

const RhineBackground = lazy(() => import("@/components/lyrics/rhine/RhineBackground"));

export default defineVisualizerBackground({
  mode: "rhine",
  order: 60,
  labelKey: "folia.options.visualizerBackgroundModeRhine",
  labelFallback: "Rhine",
  render: (props) => <RhineBackground {...props} />,
  renderSettingsPanel: (props) => <RhineBackgroundSettingsCard {...props} />,
  resetSettings: (actions) => actions?.rhine?.onResetTuning?.(),
});

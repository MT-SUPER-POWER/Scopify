import { lazy } from "react";
import { defineVisualizer } from "../definition";

const VisualizerArchive = lazy(() => import("@/components/lyrics/rhine/VisualizerArchive"));

export default defineVisualizer({
  mode: "archive",
  order: 135,
  labelKey: "folia.ui.visualizerArchive",
  labelFallback: "Archive",
  previewSeed: "rhine-archive",
  previewStartOffset: 8,
  tuningKind: "none",
  render: (props) => <VisualizerArchive {...props} />,
});

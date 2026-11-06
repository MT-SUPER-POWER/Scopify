import { lazy } from "react";
import { defineVisualizerBackground } from "../definition";
import FacetBackgroundSettingsCard from "@/components/lyrics/facet/FacetBackgroundSettingsCard";
import { FacetBackgroundQuickControls } from "@/components/lyrics/facet/FacetBackgroundQuickControls";

const FacetBackground = lazy(() => import("@/components/lyrics/facet/FacetBackground"));

export default defineVisualizerBackground({
  mode: "facet",
  order: 65,
  labelKey: "folia.options.visualizerBackgroundModeFacet",
  labelFallback: "Facet",
  render: (props) => <FacetBackground {...props} />,
  renderSettingsPanel: (props) => <FacetBackgroundSettingsCard {...props} />,
  renderQuickControls: (props) => <FacetBackgroundQuickControls {...props} />,
  resetSettings: (actions) => actions?.facet?.onResetTuning?.(),
});

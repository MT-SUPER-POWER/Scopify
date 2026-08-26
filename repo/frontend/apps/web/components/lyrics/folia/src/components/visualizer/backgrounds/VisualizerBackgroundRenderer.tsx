import React, { Suspense } from "react";
import {
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
  getVisualizerBackgroundRegistryEntry,
} from "./registry";
import type { VisualizerBackgroundRenderProps } from "./definition";

// src/components/visualizer/backgrounds/VisualizerBackgroundRenderer.tsx
// Selects the active shell background through the discoverable background registry.

const VisualizerBackgroundRenderer: React.FC<VisualizerBackgroundRenderProps> = (props) => {
  if (props.config?.transparent) {
    return null;
  }

  const mode = props.config?.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE;
  return (
    <Suspense fallback={null}>{getVisualizerBackgroundRegistryEntry(mode).render(props)}</Suspense>
  );
};

export default VisualizerBackgroundRenderer;

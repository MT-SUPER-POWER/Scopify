"use client";

import { Component, type ReactNode } from "react";
import { useMotionValue } from "framer-motion";
import VisualizerBackgroundRenderer from "@/components/lyrics/folia/src/components/visualizer/backgrounds/VisualizerBackgroundRenderer";
import { FoliaBackgroundModeGlyph } from "@/components/lyrics/FoliaModeGlyph";
import { FOLIA_SETTINGS_PREVIEW_CONTENT } from "@/constants/lyricsPreview";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { Theme, VisualizerBackgroundMode } from "@/components/lyrics/folia/src/types";

class ThumbnailErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function FoliaBackgroundThumbnail({
  mode,
  theme,
}: {
  mode: VisualizerBackgroundMode;
  theme: Theme;
}) {
  const power = useMotionValue(0.35);
  const background = useLyricStageStore((state) => state.background);
  const isDaylight = theme.name === "snow";
  const bands = { bass: power, lowMid: power, mid: power, vocal: power, treble: power };

  return (
    <ThumbnailErrorBoundary fallback={<FoliaBackgroundModeGlyph mode={mode} size={28} />}>
      <span className="[container-type:inline-size] pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute top-0 left-0 block h-[562px] w-225 origin-top-left"
          style={{ transform: "scale(calc(100cqw / 900px))" }}
        >
          <VisualizerBackgroundRenderer
            config={{ ...background, mode }}
            theme={theme}
            isDaylight={isDaylight}
            coverUrl={FOLIA_SETTINGS_PREVIEW_CONTENT.coverUrl}
            audioPower={power}
            audioBands={bands}
            staticMode
            paused
          />
        </span>
      </span>
    </ThumbnailErrorBoundary>
  );
}

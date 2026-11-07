"use client";

import { useMotionValue } from "framer-motion";
import VisualizerRenderer from "@/components/lyrics/folia/src/components/visualizer/VisualizerRenderer";
import { hasVisualizerMode } from "@/components/lyrics/folia/src/components/visualizer/registry";
import {
  FOLIA_SETTINGS_PREVIEW_LINES,
  FOLIA_SETTINGS_PREVIEW_CONTENT,
} from "@/constants/lyricsPreview";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaStyleThumbnailProps } from "@/types/lyrics/folia/visualSettings";

/** Frozen, scaled stage: visible shelf tiles do not own a playback clock. */
export function FoliaStyleThumbnail({ mode, theme, assets }: FoliaStyleThumbnailProps) {
  const time = useMotionValue(2);
  const power = useMotionValue(0.35);
  const tunings = useLyricStageStore((state) => state.tunings);
  if (!hasVisualizerMode(mode)) return null;
  return (
    <span className="[container-type:inline-size] pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="absolute top-0 left-0 block h-[562px] w-225 origin-top-left"
        style={{ transform: "scale(calc(100cqw / 900px))" }}
      >
        <VisualizerRenderer
          mode={mode}
          theme={theme}
          currentTime={time}
          currentLineIndex={0}
          lines={FOLIA_SETTINGS_PREVIEW_LINES}
          audioPower={power}
          audioBands={{ bass: power, lowMid: power, mid: power, vocal: power, treble: power }}
          staticMode
          backgroundStaticMode
          paused
          isPlayerChromeHidden
          isPreviewMode
          background={{ mode: "common", common: { disableGeometricBackground: true } }}
          visualizerTunings={tunings}
          coverUrl={FOLIA_SETTINGS_PREVIEW_CONTENT.coverUrl}
          cappellaCustomAvatarImages={assets.cappellaCustomAvatarImages}
          cappellaCustomEmojiImages={assets.cappellaCustomEmojiImages}
          monetPortraitImage={assets.monetPortraitImage}
        />
      </span>
    </span>
  );
}

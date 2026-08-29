"use client";

import { FoliaPersonalFmModeMatrix } from "@/components/lyrics/FoliaPersonalFmModeMatrix";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import type { Theme } from "@/components/lyrics/folia/src/types";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { usePlayerStore } from "@/store/module/player";

interface FoliaPersonalFmSettingsCardProps {
  controlCardBg: string;
  theme: Theme;
}

export function FoliaPersonalFmSettingsCard({
  controlCardBg,
  theme,
}: FoliaPersonalFmSettingsCardProps) {
  const isPersonalFm = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));

  if (!isPersonalFm) return null;

  return (
    <section
      className="rounded-3xl border p-4"
      style={{
        backgroundColor: controlCardBg,
        borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
      }}
    >
      <FoliaPersonalFmModeMatrix theme={theme} />
    </section>
  );
}

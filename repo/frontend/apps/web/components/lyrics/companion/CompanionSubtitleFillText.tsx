"use client";

import { SubtitleFillText } from "@/components/lyrics/subtitle/SubtitleFillText";
import { useCompanionLyricProgress } from "@/hooks/lyrics/useCompanionLyricProgress";
import type { CompanionSubtitleFillTextProps } from "@/types/subtitle-preview";

/** Keep the desktop subtitle shell and entrance/marquee hooks off the progress render path. */
export function CompanionSubtitleFillText({
  line,
  text,
  settings,
}: CompanionSubtitleFillTextProps) {
  const progress = useCompanionLyricProgress(line);
  return <SubtitleFillText text={text} settings={settings} progress={progress} />;
}

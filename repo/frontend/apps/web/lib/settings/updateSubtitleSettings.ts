import type { LyricsPreviewSettings } from "@/types/appearance";

export function updateSubtitleSettings(
  settings: LyricsPreviewSettings,
  patch: Partial<LyricsPreviewSettings>,
): LyricsPreviewSettings {
  const next = { ...settings, ...patch };
  if (next.fillEnabled && next.entrance === "typewriter") {
    if (patch.entrance === "typewriter") next.fillEnabled = false;
    else next.entrance = "fade";
  }
  return next;
}

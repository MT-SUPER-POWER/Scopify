"use client";

import { SubtitleCapsule } from "@/components/lyrics/subtitle/SubtitleCapsule";
import { useTranslation } from "react-i18next";

import type { LyricsStylePreviewProps } from "@/types/lyrics/subtitlePreview";

export function LyricsStylePreview({
  note,
  settings,
  payload,
  replayId,
  visible,
  playback,
  loop,
}: LyricsStylePreviewProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div
        className="overflow-auto rounded-lg border border-border bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/appearance/misty-mountains.png")' }}
      >
        <div className="flex min-h-48 items-center justify-center p-6">
          {visible && payload.source ? (
            <SubtitleCapsule
              settings={settings}
              payload={payload}
              replayId={replayId}
              playback={playback}
              loop={loop}
            />
          ) : (
            <span className="text-sm text-white">
              {t(visible ? "subtitlePreview.empty" : "subtitlePreview.hidden")}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {note ?? t("appearance.lyrics.note")}
      </p>
    </div>
  );
}

"use client";

import type { CSSProperties } from "react";
import { SubtitleCapsule } from "@/components/lyrics/subtitle/SubtitleCapsule";
import { DesktopSubtitleToolbar } from "@/components/lyrics/subtitle/DesktopSubtitleToolbar";
import { useDesktopSubtitle } from "@/hooks/lyrics/useDesktopSubtitle";
import { useI18n } from "@/store/module/i18n";

export function DesktopLyricView() {
  const { t } = useI18n();
  const view = useDesktopSubtitle();
  const source = view.line?.text || view.projection.track?.title || t("subtitlePalette.waiting");
  return (
    <div
      data-desktop-lyrics-root
      className="flex w-full items-start justify-center bg-transparent p-2"
    >
      <div
        ref={view.contentRef}
        className="group/subtitle relative w-fit max-w-full pt-8"
        style={{ WebkitAppRegion: "drag" } as CSSProperties}
      >
        <DesktopSubtitleToolbar />
        <SubtitleCapsule
          settings={{
            ...view.settings,
            entrance: view.line ? view.settings.entrance : "none",
            fillEnabled: view.settings.fillEnabled && Boolean(view.line),
          }}
          payload={{
            source,
            target: view.line?.translation ?? "",
            isChinese: view.isChinese,
          }}
          replayId={view.index}
          playback={view.playback}
          loop={false}
          fillProgress={view.fillProgress}
        />
      </div>
    </div>
  );
}

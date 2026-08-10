"use client";

import { Palette } from "lucide-react";

import { DesktopPlaybackFoliaModeControls } from "@/components/desktopWallpaper/DesktopPlaybackFoliaModeControls";
import { DesktopPlaybackThemeControls } from "@/components/desktopWallpaper/DesktopPlaybackThemeControls";
import { FoliaSonnetPerformanceWarningDialog } from "@/components/lyrics/FoliaSonnetPerformanceWarningDialog";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";

export function DesktopPlaybackAppearanceControls() {
  const { t } = useI18n();
  const cancelSonnetPerformanceWarning = useLyricStageStore(
    (state) => state.cancelSonnetPerformanceWarning,
  );
  const confirmSonnetPerformanceWarning = useLyricStageStore(
    (state) => state.confirmSonnetPerformanceWarning,
  );
  const dontShowAgain = useLyricStageStore((state) => state.sonnetPerformanceWarningDontShowAgain);
  const isOpen = useLyricStageStore((state) => state.sonnetPerformanceWarningOpen);
  const isDaylight = useLyricStageStore((state) => state.themeVariant === "light");
  const setDontShowAgain = useLyricStageStore(
    (state) => state.setSonnetPerformanceWarningDontShowAgain,
  );

  return (
    <section className="h-full overflow-y-auto px-5 py-4">
      <div className="mb-4 flex items-start gap-3">
        <Palette className="text-brand mt-0.5 size-4 shrink-0" />
        <div>
          <h2 className="text-content text-sm font-semibold">
            {t("desktopPlaybackController.appearance")}
          </h2>
          <p className="text-content-muted mt-1 text-[11px] leading-4">
            {t("desktopPlaybackController.liveSyncHint")}
          </p>
        </div>
      </div>

      <DesktopPlaybackFoliaModeControls />

      <div className="border-border my-5 border-t pt-4">
        <div className="text-content-muted mb-3 text-[11px] font-semibold tracking-wide uppercase">
          {t("folia.options.customThemeQuickEditTitle")}
        </div>
        <DesktopPlaybackThemeControls />
      </div>

      <FoliaSonnetPerformanceWarningDialog
        dontShowAgain={dontShowAgain}
        isDaylight={isDaylight}
        isOpen={isOpen}
        onClose={cancelSonnetPerformanceWarning}
        onConfirm={confirmSonnetPerformanceWarning}
        onDontShowAgainChange={setDontShowAgain}
      />
    </section>
  );
}

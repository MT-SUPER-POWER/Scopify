"use client";

import { Paintbrush, Palette } from "lucide-react";

import { DesktopPlaybackFoliaModeControls } from "@/components/desktopWallpaper/DesktopPlaybackFoliaModeControls";
import { DesktopPlaybackThemeControls } from "@/components/desktopWallpaper/DesktopPlaybackThemeControls";
import { FoliaSonnetPerformanceWarningDialog } from "@/components/lyrics/FoliaSonnetPerformanceWarningDialog";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";

interface DesktopPlaybackAppearanceControlsProps {
  onOpenMainSettings(): void;
}

export function DesktopPlaybackAppearanceControls({
  onOpenMainSettings,
}: DesktopPlaybackAppearanceControlsProps) {
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
    <section className="desktop-controller-scroll h-full overflow-y-auto px-4 pt-3 pb-4">
      <div className="mb-3 flex items-start gap-3 px-1">
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

      <div className="desktop-controller-card mt-3 rounded-2xl p-3">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="text-content-muted text-[10px] font-semibold tracking-[0.12em] uppercase">
            {t("desktopPlaybackController.themeSwitch")}
          </div>
          <button
            type="button"
            aria-label={t("desktopPlaybackController.openMainSettings")}
            className="desktop-controller-soft-button -my-1 flex size-8 items-center justify-center rounded-full transition"
            title={t("desktopPlaybackController.openMainSettings")}
            onClick={onOpenMainSettings}
          >
            <Paintbrush className="size-4" />
          </button>
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

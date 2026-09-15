"use client";

import { DEFAULT_RHINE_BACKGROUND_TUNING } from "@/constants/rhineBackground";
import { useRhineBackground } from "@/hooks/lyrics/useRhineBackground";
import { useI18n } from "@/store/module/i18n";
import type { RhineBackgroundProps } from "@/types/rhineBackground";

export default function RhineBackground(props: RhineBackgroundProps) {
  const { canvasRef, status, attempt, retry } = useRhineBackground(props);
  const { t } = useI18n();
  const tuning = { ...DEFAULT_RHINE_BACKGROUND_TUNING, ...props.config?.rhine?.tuning };
  const dark = tuning.colorMode === "auto" ? !props.isDaylight : tuning.colorMode === "dark";
  const background = dark ? "#11181b" : "#eae5e1";

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" style={{ backgroundColor: background }}>
      <canvas key={attempt} ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full"
        style={{ visibility: status === "ready" ? "visible" : "hidden" }} />
      <div className="absolute inset-0" style={{ backgroundColor: props.theme.backgroundColor, opacity: tuning.overlayOpacity }} />
      {status === "error" ? (
        <div role="status" className="pointer-events-auto absolute bottom-6 left-6 flex items-center gap-3 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: background, color: dark ? "#ece8df" : "#242a28" }}>
          <span>{t("folia.rhine.loadError")}</span>
          <button type="button" onClick={retry} className="rounded px-2 py-1 underline focus-visible:outline-2">
            {t("folia.rhine.retry")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

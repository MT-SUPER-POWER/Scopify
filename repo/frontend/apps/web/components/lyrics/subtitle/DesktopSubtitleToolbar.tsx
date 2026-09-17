"use client";

import { Settings2, X, Pin } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";

export function DesktopSubtitleToolbar() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const togglePin = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const current = await runtime.desktopLyrics.getPreferences();
      if (
        !current ||
        !(await runtime.desktopLyrics.updatePreferences({ alwaysOnTop: !current.alwaysOnTop }))
      )
        throw new Error("Unavailable");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="pointer-events-none absolute top-0 right-0 flex h-8 items-center gap-1 pb-1 opacity-0 transition-opacity group-hover/subtitle:pointer-events-auto group-hover/subtitle:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100"
      style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
    >
      {failed && (
        <span role="alert" className="text-xs text-white">
          {t("subtitleControl.failed")}
        </span>
      )}
      <button
        type="button"
        aria-label={t("desktopLyrics.keepOnTop")}
        title={t("desktopLyrics.keepOnTop")}
        disabled={busy}
        onClick={() => void togglePin()}
        className="flex size-7 shrink-0 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50"
      >
        <Pin className="size-4" />
      </button>
      <button
        type="button"
        aria-label={t("subtitleControl.style")}
        title={t("subtitleControl.style")}
        onClick={() =>
          runtime.navigation.navigateMainWindow("/setting?tab=appearance#subtitle-style")
        }
        className="flex size-7 shrink-0 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white"
      >
        <Settings2 className="size-4" />
      </button>
      <button
        type="button"
        aria-label={t("desktopLyrics.close")}
        title={t("desktopLyrics.close")}
        onClick={() => void runtime.desktopLyrics.close()}
        className="flex size-7 shrink-0 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

"use client";

import { Settings2, X, Pin } from "lucide-react";
import { useState } from "react";
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
      className="flex h-7 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
      style={{ WebkitAppRegion: "no-drag" } as import("react").CSSProperties}
    >
      {failed && (
        <span role="alert" className="text-xs text-white">
          {t("subtitleControl.failed")}
        </span>
      )}
      <button
        aria-label={t("desktopLyrics.keepOnTop")}
        title={t("desktopLyrics.keepOnTop")}
        disabled={busy}
        onClick={() => void togglePin()}
        className="rounded bg-black/60 p-1 text-white"
      >
        <Pin className="size-4" />
      </button>
      <button
        aria-label={t("subtitleControl.style")}
        title={t("subtitleControl.style")}
        onClick={() =>
          runtime.navigation.navigateMainWindow("/setting?tab=appearance#subtitle-style")
        }
        className="rounded bg-black/60 p-1 text-white"
      >
        <Settings2 className="size-4" />
      </button>
      <button
        aria-label={t("desktopLyrics.close")}
        title={t("desktopLyrics.close")}
        onClick={() => void runtime.desktopLyrics.close()}
        className="rounded bg-black/60 p-1 text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

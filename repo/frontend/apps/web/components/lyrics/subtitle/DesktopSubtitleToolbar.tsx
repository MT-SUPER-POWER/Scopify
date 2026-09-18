"use client";

import { Languages, Settings2, X, Pin } from "lucide-react";
import type { CSSProperties } from "react";
import { useDesktopSubtitleControlSync } from "@/hooks/player/useDesktopSubtitleControlSync";
import { runtime } from "@/lib/runtime";
import { useAppearanceStore } from "@/store/module/appearance";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useI18n } from "@/store/module/i18n";

export function DesktopSubtitleToolbar() {
  const { t } = useI18n();
  const control = useDesktopSubtitleControl();
  const showTranslation = useAppearanceStore((state) => state.lyricsPreview.showTranslation);
  const updateLyricsPreview = useAppearanceStore((state) => state.updateLyricsPreview);
  useDesktopSubtitleControlSync();
  const buttonClassName =
    "flex size-7 shrink-0 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 aria-pressed:bg-white aria-pressed:text-black aria-pressed:hover:bg-white/90";
  return (
    <div
      className="pointer-events-none absolute top-0 right-0 flex h-8 items-center gap-1 pb-1 opacity-0 transition-opacity group-hover/subtitle:pointer-events-auto group-hover/subtitle:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100"
      style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
    >
      {control.failed && (
        <span
          role="alert"
          className="absolute top-8 right-0 z-10 w-32 rounded bg-black/90 p-2 text-xs text-white"
        >
          {t("subtitleControl.failed")}
        </span>
      )}
      <button
        type="button"
        aria-label={t("desktopLyrics.keepOnTop")}
        aria-pressed={Boolean(control.preferences?.alwaysOnTop)}
        title={t("desktopLyrics.keepOnTop")}
        disabled={control.busy || !control.preferences}
        onClick={() => void control.configure({ alwaysOnTop: !control.preferences?.alwaysOnTop })}
        className={buttonClassName}
      >
        <Pin className="size-4" />
      </button>
      <button
        type="button"
        aria-label={t("subtitlePreview.translation")}
        aria-pressed={showTranslation}
        title={t("subtitlePreview.translation")}
        onClick={() => updateLyricsPreview({ showTranslation: !showTranslation })}
        className={buttonClassName}
      >
        <Languages className="size-4" />
      </button>
      <button
        type="button"
        aria-label={t("subtitleControl.style")}
        title={t("subtitleControl.style")}
        onClick={() =>
          runtime.navigation.navigateMainWindow("/setting?tab=appearance#subtitle-style")
        }
        className={buttonClassName}
      >
        <Settings2 className="size-4" />
      </button>
      <button
        type="button"
        aria-label={t("desktopLyrics.close")}
        title={t("desktopLyrics.close")}
        disabled={control.busy}
        onClick={() => void control.close()}
        className="flex size-7 shrink-0 items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

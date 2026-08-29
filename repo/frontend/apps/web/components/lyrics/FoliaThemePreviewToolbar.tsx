"use client";

import { Check, Pause, Play, RotateCcw } from "lucide-react";

import { useI18n } from "@/store/module/i18n";
import type { FoliaThemePreviewToolbarProps } from "@/types/components/lyrics";

export function FoliaThemePreviewToolbar({
  context,
  isPaused,
  modeLabel,
  onPauseChange,
  onRestart,
  theme,
}: FoliaThemePreviewToolbarProps) {
  const { t } = useI18n();
  const colors = [
    [t("folia.options.aiThemeQuickEditBackground"), theme.backgroundColor],
    [t("folia.options.aiThemeQuickEditPrimary"), theme.primaryColor],
    [t("folia.options.aiThemeQuickEditAccent"), theme.accentColor],
    [t("folia.options.aiThemeQuickEditSecondary"), theme.secondaryColor],
  ] as const;
  const statusLabel = context.isDirty
    ? t("folia.options.themeEditing")
    : context.saveState === "saved"
      ? t("folia.options.themeSaved")
      : context.isApplied
        ? t("folia.options.themeApplied")
        : t("folia.options.themePreview");

  return (
    <>
      <div className="absolute top-4 left-4 z-40 flex max-w-[calc(100%-8rem)] flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-white/85 uppercase backdrop-blur-md">
          {context.variant === "light"
            ? t("folia.options.lightTheme")
            : t("folia.options.darkTheme")}
        </span>
        <span
          aria-live="polite"
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-semibold backdrop-blur-md ${
            context.isDirty
              ? "border-amber-300/35 bg-amber-400/85 text-zinc-950"
              : "border-white/15 bg-black/35 text-white/85"
          }`}
        >
          {!context.isDirty ? <Check size={11} /> : null}
          {statusLabel}
        </span>
        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-semibold text-white/85 backdrop-blur-md">
          {modeLabel}
        </span>
        <span
          aria-label={String(t("folia.options.themePalette"))}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur-md"
        >
          {colors.map(([label, color]) => (
            <i
              aria-label={`${label}: ${color}`}
              className="size-3 rounded-full border border-white/30"
              key={label}
              role="img"
              style={{ backgroundColor: color }}
              title={`${label}: ${color}`}
            />
          ))}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          aria-label={String(t("folia.options.restartPreview"))}
          className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/85 backdrop-blur-md transition hover:bg-black/55"
          onClick={onRestart}
          title={String(t("folia.options.restartPreview"))}
          type="button"
        >
          <RotateCcw size={14} />
        </button>
        <button
          aria-label={String(t(isPaused ? "folia.ui.play" : "folia.ui.pause"))}
          className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/85 backdrop-blur-md transition hover:bg-black/55"
          onClick={() => onPauseChange(!isPaused)}
          title={String(t(isPaused ? "folia.ui.play" : "folia.ui.pause"))}
          type="button"
        >
          {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
        </button>
      </div>
    </>
  );
}

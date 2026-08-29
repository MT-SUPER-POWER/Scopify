"use client";

import { Check, ChevronDown, Palette, RotateCcw, Save } from "lucide-react";

import { useI18n } from "@/store/module/i18n";
import type { FoliaThemeWorkbenchHeaderProps } from "@/types/components/lyrics";

export function FoliaThemeWorkbenchHeader({
  activeThemeId,
  draftTheme,
  isDirty,
  onClose,
  onReset,
  onSaveAndApply,
  saveState,
  selectedThemeId,
  theme,
}: FoliaThemeWorkbenchHeaderProps) {
  const { t } = useI18n();
  const isApplied = selectedThemeId === activeThemeId;
  const statusText = isDirty
    ? t("folia.options.themeEditingUnsaved")
    : saveState === "saved"
      ? t("folia.options.themeSaved")
      : isApplied
        ? t("folia.options.themeApplied")
        : t("folia.options.themePreviewingSaved");

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label={String(t("folia.ui.close"))}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
          onClick={onClose}
          title={String(t("folia.ui.close"))}
          type="button"
        >
          <ChevronDown size={18} />
        </button>
        <Palette className="shrink-0" size={18} style={{ color: theme.accentColor }} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-lg font-semibold" style={{ color: theme.primaryColor }}>
              {t("folia.options.themeLibrary")}
            </h2>
            <span
              aria-live="polite"
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isDirty
                  ? "bg-amber-500/15 text-amber-500"
                  : saveState === "saved"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-white/8"
              }`}
            >
              {statusText}
            </span>
          </div>
          <p className="truncate text-xs opacity-55" style={{ color: theme.secondaryColor }}>
            {draftTheme.name}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex"
          disabled={!isDirty}
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={14} />
          {t("folia.options.resetTheme")}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!isDirty && isApplied}
          onClick={onSaveAndApply}
          style={{ backgroundColor: theme.accentColor, color: theme.backgroundColor }}
          type="button"
        >
          {saveState === "saved" ? <Check size={14} /> : <Save size={14} />}
          {t("folia.options.saveAndApplyCustomTheme")}
        </button>
      </div>
    </header>
  );
}

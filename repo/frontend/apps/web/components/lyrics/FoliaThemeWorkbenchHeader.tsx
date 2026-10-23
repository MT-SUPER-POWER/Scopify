"use client";

import { Check, RotateCcw, Save } from "lucide-react";

import { FoliaStudioHeader } from "@scopify/ui/scopify/components/folia-studio/header";
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
    <FoliaStudioHeader
      title={t("folia.options.themeLibrary")}
      backLabel={t("folia.ui.close")}
      onBack={onClose}
      metadata={
        <>
          <span className="truncate" title={draftTheme.name}>
            {draftTheme.name}
          </span>
          <span
            aria-live="polite"
            className="shrink-0 rounded-md bg-[var(--st-fill)] px-2 py-1 font-medium"
          >
            {statusText}
          </span>
        </>
      }
      actions={
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="st-t-fast inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--st-line2)] px-2.5 text-xs font-medium text-[color:var(--st-t2)] transition-colors hover:bg-[var(--st-fill)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isDirty}
            aria-label={t("folia.options.resetTheme")}
            title={t("folia.options.resetTheme")}
            onClick={onReset}
            type="button"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">{t("folia.options.resetTheme")}</span>
          </button>
          <button
            className="st-t-fast inline-flex h-8 items-center gap-2 rounded-lg bg-[var(--st-accent)] px-3 text-xs font-medium text-[color:var(--st-on-accent)] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isDirty && isApplied}
            aria-label={t("folia.options.saveAndApplyCustomTheme")}
            title={t("folia.options.saveAndApplyCustomTheme")}
            onClick={onSaveAndApply}
            type="button"
          >
            {saveState === "saved" ? <Check size={14} /> : <Save size={14} />}
            <span className="hidden sm:inline">{t("folia.options.saveAndApplyCustomTheme")}</span>
          </button>
        </div>
      }
    />
  );
}

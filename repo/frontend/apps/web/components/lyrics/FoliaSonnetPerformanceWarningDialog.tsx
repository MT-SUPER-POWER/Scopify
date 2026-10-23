"use client";

import { FoliaStudioWindow } from "@scopify/ui/scopify/components/folia-studio/window";
import { AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

import { useFoliaModalFocus } from "@/hooks/lyrics/useFoliaModalFocus";
import { useI18n } from "@/store/module/i18n";
import type { FoliaSonnetPerformanceWarningDialogProps } from "@/types/components/lyrics";

export function FoliaSonnetPerformanceWarningDialog({
  dontShowAgain,
  isDaylight,
  isOpen,
  onClose,
  onConfirm,
  onDontShowAgainChange,
}: FoliaSonnetPerformanceWarningDialogProps) {
  const { t } = useI18n();
  const dialogRef = useFoliaModalFocus(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen ? (
        <FoliaStudioWindow
          compact
          panelRef={dialogRef}
          layer={180}
          title={t("folia.options.sonnetPerformanceWarningTitle")}
          backLabel={t("folia.ui.cancel")}
          onClose={onClose}
          isDaylight={isDaylight}
          colors={{ primaryColor: isDaylight ? "#171b27" : "#f0f0f3" }}
          header={<div />}
        >
          <div className="st-scroll min-h-0 overflow-y-auto p-6">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                  isDaylight ? "bg-amber-500/12 text-amber-700" : "bg-amber-400/12 text-amber-300"
                }`}
              >
                <AlertTriangle size={21} />
              </div>
              <div className="space-y-2">
                <h2 id="folia-sonnet-warning-title" className="text-lg font-semibold">
                  {t("folia.options.sonnetPerformanceWarningTitle")}
                </h2>
                <p
                  className={`text-sm leading-6 ${isDaylight ? "text-zinc-600" : "text-zinc-300"}`}
                >
                  {t("folia.options.sonnetPerformanceWarningDescription")}
                </p>
              </div>
            </div>

            <label
              className={`mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm ${
                isDaylight ? "border-black/8 bg-black/3" : "border-white/10 bg-white/5"
              }`}
            >
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(event) => onDontShowAgainChange(event.currentTarget.checked)}
                className="size-4 accent-current"
              />
              <span>{t("folia.options.sonnetPerformanceWarningDontShowAgain")}</span>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                  isDaylight
                    ? "border-zinc-200 bg-zinc-100 hover:bg-zinc-200"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {t("folia.ui.cancel")}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  isDaylight
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-white text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {t("folia.ui.apply")}
              </button>
            </div>
          </div>
        </FoliaStudioWindow>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, RotateCcw, Upload, X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { FoliaSettingsPreview } from "@/components/lyrics/FoliaSettingsPreview";
import VisPlaygroundSettingsPanel from "@/components/lyrics/folia/src/components/visualizer/VisPlaygroundSettingsPanel";
import { useFoliaStageSettingsPanel } from "@/hooks/player/useFoliaStageSettingsPanel";
import {
  normalizeFoliaStageSettings,
  selectFoliaStageSettings,
} from "@/lib/lyrics/foliaStageSettings";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaVisualSettingsDialogProps } from "@/types/components/lyrics";

export function FoliaVisualSettingsDialog({
  assets,
  bridge,
  isOpen,
  onClose,
  onOpenFontPicker,
  onSectionChange,
  section,
  theme,
}: FoliaVisualSettingsDialogProps) {
  const { t } = useTranslation();
  const importInputRef = useRef<HTMLInputElement>(null);
  const panelProps = useFoliaStageSettingsPanel(
    section,
    onSectionChange,
    theme,
    assets,
    onOpenFontPicker,
  );

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm md:p-6"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={String(t("options.visualSettings"))}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-white shadow-2xl md:max-h-[calc(100dvh-3rem)]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 md:px-5">
              <span className="text-sm font-medium">{t("options.visualSettings")}</span>
              <span className="flex items-center gap-1">
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => void importSettings(event.currentTarget.files?.[0])}
                />
                <DialogIconButton
                  title={String(t("options.import"))}
                  onClick={() => importInputRef.current?.click()}
                >
                  <Upload size={17} />
                </DialogIconButton>
                <DialogIconButton title={String(t("options.export"))} onClick={exportSettings}>
                  <Download size={17} />
                </DialogIconButton>
                <DialogIconButton
                  title={String(t("ui.default"))}
                  onClick={() => useLyricStageStore.getState().resetAll()}
                >
                  <RotateCcw size={17} />
                </DialogIconButton>
                <DialogIconButton title={String(t("ui.close"))} onClick={onClose}>
                  <X size={18} />
                </DialogIconButton>
              </span>
            </header>

            <div className="grid min-h-0 flex-1 grid-rows-[minmax(14rem,34dvh)_minmax(0,1fr)] lg:grid-cols-[minmax(20rem,0.8fr)_minmax(24rem,1fr)] lg:grid-rows-1">
              <FoliaSettingsPreview assets={assets} bridge={bridge} theme={theme} />
              <div className="min-h-0 overflow-y-auto border-t border-white/10 p-4 lg:border-t-0 lg:border-l lg:p-5">
                <VisPlaygroundSettingsPanel {...panelProps} />
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DialogIconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded-md p-2 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function exportSettings() {
  const settings = selectFoliaStageSettings(useLyricStageStore.getState());
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "scopify-folia-stage.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importSettings(file?: File) {
  if (!file) return;

  try {
    const candidate: unknown = JSON.parse(await file.text());
    const current = selectFoliaStageSettings(useLyricStageStore.getState());
    useLyricStageStore.getState().replaceSettings(normalizeFoliaStageSettings(candidate, current));
  } catch (error) {
    console.warn("[folia-stage] invalid settings import", error);
  }
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { FoliaSettingsPreview } from "@/components/lyrics/FoliaSettingsPreview";
import { FoliaThemeQuickPicker } from "@/components/lyrics/FoliaThemeQuickPicker";
import VisPlaygroundSettingsPanel from "@/components/lyrics/folia/src/components/visualizer/VisPlaygroundSettingsPanel";
import { useFoliaStageSettingsPanel } from "@/hooks/player/useFoliaStageSettingsPanel";
import type { FoliaVisualSettingsDialogProps } from "@/types/components/lyrics";

export function FoliaVisualSettingsDialog({
  assets,
  bridge,
  isOpen,
  onClose,
  onOpenFontPicker,
  onOpenThemeLibrary,
  onSectionChange,
  section,
  theme,
}: FoliaVisualSettingsDialogProps) {
  const { t } = useTranslation();
  const panelProps = useFoliaStageSettingsPanel(
    section,
    onSectionChange,
    theme,
    assets,
    onOpenFontPicker,
  );
  const isDaylight = panelProps.isDaylight;
  const overlayBackground = isDaylight ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.65)";
  const surfaceClass = isDaylight ? "border-black/5 bg-white/70" : "border-white/10 bg-zinc-950/88";

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
          className="fixed inset-0 z-[140] p-3 backdrop-blur-xl sm:p-5"
          style={{ backgroundColor: overlayBackground }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={String(t("options.visualSettings"))}
            initial={{ opacity: 0, scale: 0.98, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
            className={`mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[32px] border shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${surfaceClass}`}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 p-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  title={String(t("ui.close"))}
                  aria-label={String(t("ui.close"))}
                  onClick={onClose}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                  style={{ color: theme.primaryColor }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="min-w-0">
                  <div
                    className="truncate text-lg font-semibold sm:text-xl"
                    style={{ color: theme.primaryColor }}
                  >
                    {t("options.lyricsStyleSettings")}
                  </div>
                </div>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
              <FoliaSettingsPreview
                activeSection={section}
                assets={assets}
                bridge={bridge}
                onSectionChange={onSectionChange}
                theme={theme}
              />
              <VisPlaygroundSettingsPanel
                {...panelProps}
                themeControl={
                  <FoliaThemeQuickPicker onOpenThemeLibrary={onOpenThemeLibrary} theme={theme} />
                }
              />
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

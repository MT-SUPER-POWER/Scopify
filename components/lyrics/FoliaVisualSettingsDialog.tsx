"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaSettingsPreview } from "@/components/lyrics/FoliaSettingsPreview";
import { FoliaThemeQuickPicker } from "@/components/lyrics/FoliaThemeQuickPicker";
import VisPlaygroundSettingsPanel from "@/components/lyrics/folia/src/components/visualizer/VisPlaygroundSettingsPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFoliaStageSettingsPanel } from "@/hooks/player/useFoliaStageSettingsPanel";
import type { FoliaVisualSettingsDialogProps } from "@/types/components/lyrics";

/**
 * @brief 右下角沉浸式歌词的设置小面板
 */
export function FoliaVisualSettingsDialog({
  assets,
  isOpen,
  onClose,
  onOpenFontPicker,
  onOpenThemeLibrary,
  onSectionChange,
  section,
  theme,
}: FoliaVisualSettingsDialogProps) {
  const { t } = useI18n();
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
          onPointerDown={onClose}
          className="fixed inset-0 z-140 p-3 backdrop-blur-xl sm:p-5"
          style={{ backgroundColor: overlayBackground }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={String(t("folia.options.visualSettings"))}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onPointerDown={(event) => event.stopPropagation()}
            className={`mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[32px] border shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${surfaceClass}`}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 p-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  title={String(t("folia.ui.close"))}
                  aria-label={String(t("folia.ui.close"))}
                  onClick={onClose}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                  style={{ color: theme.primaryColor }}
                >
                  <ChevronDown size={18} />
                </button>
                <div className="min-w-0">
                  <div
                    className="truncate text-lg font-semibold sm:text-xl"
                    style={{ color: theme.primaryColor }}
                  >
                    {t("folia.options.lyricsStyleSettings")}
                  </div>
                </div>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-rows-[1fr] gap-4 overflow-hidden p-4 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
              <FoliaSettingsPreview
                activeSection={section}
                assets={assets}
                onSectionChange={onSectionChange}
                theme={theme}
              />
              <ScrollArea className="h-full min-h-0">
                <div className="space-y-4 pr-1 pb-6">
                  <VisPlaygroundSettingsPanel
                    {...panelProps}
                    themeControl={
                      <FoliaThemeQuickPicker
                        onOpenThemeLibrary={onOpenThemeLibrary}
                        theme={theme}
                      />
                    }
                  />
                </div>
              </ScrollArea>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

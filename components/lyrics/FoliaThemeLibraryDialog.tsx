"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Palette } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaThemeEditor } from "@/components/lyrics/FoliaThemeEditor";
import { FoliaThemeLibraryList } from "@/components/lyrics/FoliaThemeLibraryList";
import { getFoliaStageTheme } from "@/lib/lyrics/foliaTheme";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeLibraryDialogProps } from "@/types/components/lyrics";

export function FoliaThemeLibraryDialog({
  assets,
  isOpen,
  onClose,
  theme,
}: FoliaThemeLibraryDialogProps) {
  const { t } = useI18n();
  const themeId = useLyricStageStore((state) => state.themeId);
  const themes = useLyricStageStore((state) => state.themes);
  const [selectedThemeId, setSelectedThemeId] = useState(themeId);
  const isDaylight = theme.name === "snow";

  useEffect(() => {
    if (isOpen) setSelectedThemeId(themeId);
  }, [isOpen, themeId]);

  useEffect(() => {
    if (!themes.some((item) => item.id === selectedThemeId)) {
      setSelectedThemeId(themes[0]?.id ?? themeId);
    }
  }, [selectedThemeId, themeId, themes]);

  const selectedTheme = useMemo(
    () => getFoliaStageTheme(themes, selectedThemeId),
    [selectedThemeId, themes],
  );
  const overlayBackground = isDaylight ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.65)";
  const surfaceClass = isDaylight ? "border-black/5 bg-white/70" : "border-white/10 bg-zinc-950/88";

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={onClose}
          className="fixed inset-0 z-150 p-3 backdrop-blur-xl sm:p-5"
          style={{ backgroundColor: overlayBackground }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={String(t("folia.options.themeLibrary"))}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onPointerDown={(event) => event.stopPropagation()}
            className={`mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[32px] border shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${surfaceClass}`}
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-white/10 p-4 sm:px-6">
              <button
                type="button"
                title={String(t("folia.ui.close"))}
                onClick={onClose}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
                style={{ color: theme.primaryColor }}
              >
                <ChevronDown size={18} />
              </button>
              <Palette size={18} style={{ color: theme.accentColor }} />
              <div className="min-w-0">
                <h2
                  className="truncate text-lg font-semibold"
                  style={{ color: theme.primaryColor }}
                >
                  {t("folia.options.themeLibrary")}
                </h2>
                <p className="text-xs opacity-55" style={{ color: theme.secondaryColor }}>
                  {t("folia.options.themeLibraryDesc")}
                </p>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[230px_minmax(0,1fr)]">
              <FoliaThemeLibraryList
                onSelectTheme={setSelectedThemeId}
                selectedThemeId={selectedThemeId}
              />
              <FoliaThemeEditor
                assets={assets}
                onSelectTheme={setSelectedThemeId}
                selectedTheme={selectedTheme}
              />
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

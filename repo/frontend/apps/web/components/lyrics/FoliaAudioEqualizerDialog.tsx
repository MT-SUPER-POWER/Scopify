"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect } from "react";

import { FoliaAudioEqualizerPanel } from "@/components/lyrics/FoliaAudioEqualizerPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/store/module/i18n";
import type { FoliaAudioEqualizerDialogProps } from "@/types/components/lyrics";

export function FoliaAudioEqualizerDialog({
  isOpen,
  onClose,
  theme,
}: FoliaAudioEqualizerDialogProps) {
  const { t } = useI18n();
  const isDaylight = theme.name === "snow";

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
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-170 flex items-center justify-center p-4 backdrop-blur-xl"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onPointerDown={onClose}
          style={{ backgroundColor: isDaylight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.72)" }}
        >
          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label={t("audioEqualizer.title")}
            aria-modal="true"
            className={`w-full max-w-2xl overflow-hidden rounded-[30px] border shadow-[0_32px_110px_rgba(0,0,0,0.46)] ${
              isDaylight
                ? "border-black/8 bg-white/94 text-zinc-900"
                : "border-white/10 bg-zinc-950/94 text-white"
            }`}
            exit={{ opacity: 0, scale: 0.97, y: 18 }}
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            onPointerDown={(event) => event.stopPropagation()}
            role="dialog"
            style={{
              background: isDaylight
                ? `linear-gradient(145deg, color-mix(in srgb, ${theme.accentColor} 8%, white), rgba(255,255,255,.97) 38%)`
                : `radial-gradient(circle at 12% 0%, color-mix(in srgb, ${theme.accentColor} 14%, transparent), transparent 34%), rgba(9,9,12,.97)`,
            }}
          >
            <header className="flex items-center justify-between border-b border-current/8 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-9 items-center justify-center rounded-xl border border-current/10 bg-current/[0.04]"
                  style={{ color: theme.accentColor }}
                >
                  <SlidersHorizontal size={16} />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {t("audioEqualizer.title")}
                  </h2>
                  <p className="mt-0.5 text-[11px] opacity-50">{t("audioEqualizer.description")}</p>
                </div>
              </div>
              <button
                aria-label={t("audioEqualizer.close")}
                className={`rounded-full p-2 transition-colors ${isDaylight ? "hover:bg-black/8" : "hover:bg-white/10"}`}
                onClick={onClose}
                type="button"
              >
                <X size={16} />
              </button>
            </header>
            <ScrollArea className="max-h-[min(78vh,42rem)]">
              <div className="p-5">
                <FoliaAudioEqualizerPanel theme={theme} />
              </div>
            </ScrollArea>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { FoliaGlobalLyricOffsetRuler } from "@/components/lyrics/FoliaGlobalLyricOffsetRuler";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import { useFoliaPlaybackBridge } from "@/hooks/player/useFoliaPlaybackBridge";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import type { FoliaGlobalLyricOffsetDialogProps } from "@/types/components/lyrics";

const LIMIT_MS = 2000;
const STEPS = [50, 10, 1];

export function FoliaGlobalLyricOffsetDialog({
  isOpen,
  onClose,
  theme,
}: FoliaGlobalLyricOffsetDialogProps) {
  const { t } = useI18n();
  const bridge = useFoliaPlaybackBridge();
  const applied = useLyricStageStore((state) => state.lyricOffsetMs);
  const patchSettings = useLyricStageStore((state) => state.patchSettings);
  const [draft, setDraft] = useState(applied);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const isDaylight = theme.name === "snow";
  const clamp = (value: number) => Math.round(Math.max(-LIMIT_MS, Math.min(LIMIT_MS, value)));

  useEffect(() => {
    if (isOpen) setDraft(applied);
  }, [applied, isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const update = (time: number) => {
      const previewTime = time - (draft - applied) / 1000;
      let index = -1;
      for (let cursor = 0; cursor < bridge.lines.length; cursor += 1)
        if (bridge.lines[cursor].startTime <= previewTime) index = cursor;
      setPreviewIndex((current) => (current === index ? current : index));
    };
    update(bridge.lyricCurrentTime.get());
    return bridge.lyricCurrentTime.on("change", update);
  }, [applied, bridge.lines, bridge.lyricCurrentTime, draft, isOpen]);

  if (typeof document === "undefined") return null;
  const current = bridge.lines[previewIndex];
  const next = bridge.lines[previewIndex + 1];
  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-220 flex items-center justify-center p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={onClose}
          style={{
            backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.78 : 0.84),
          }}
        >
          <motion.section
            className="w-full max-w-2xl overflow-hidden rounded-[32px] border shadow-2xl"
            initial={{ y: 24, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.985 }}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.96 : 0.9),
              borderColor: colorWithAlpha(theme.secondaryColor, 0.18),
              color: theme.primaryColor,
            }}
          >
            <header className="flex items-center justify-between border-b border-current/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <button
                  className="flex size-10 items-center justify-center rounded-full border border-current/10"
                  onClick={onClose}
                  type="button"
                >
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold">{t("folia.offset.title")}</h2>
                  <p className="mt-1 text-xs opacity-50">{t("folia.offset.subtitle")}</p>
                </div>
              </div>
              <button
                className="rounded-full border border-current/10 px-4 py-2 text-sm disabled:opacity-35"
                disabled={draft === applied}
                onClick={() => {
                  patchSettings({ lyricOffsetMs: draft });
                  onClose();
                }}
                type="button"
              >
                {t("folia.offset.apply")}
              </button>
            </header>
            <div className="space-y-5 p-6">
              <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-current/10 bg-current/[.025] px-5 text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current?.startTime ?? "empty"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <div className="text-lg font-semibold">
                      {current?.fullText ?? t("folia.offset.waiting")}
                    </div>
                    <div className="mt-2 text-xs opacity-45">
                      {current?.translation ?? next?.fullText ?? " "}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="rounded-2xl border border-current/10 p-5">
                <div className="text-center">
                  <span className="font-mono text-4xl font-semibold tabular-nums">
                    {draft > 0 ? `+${draft}` : draft}
                  </span>
                  <span className="ml-1 text-sm opacity-45">ms</span>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {STEPS.map((step) => (
                    <button
                      className="rounded-full border border-current/10 px-3 py-2 font-mono text-xs"
                      key={`minus-${step}`}
                      onClick={() => setDraft(clamp(draft - step))}
                      type="button"
                    >
                      -{step}ms
                    </button>
                  ))}
                  <button
                    aria-label={t("folia.offset.reset")}
                    className="flex size-9 items-center justify-center rounded-full border border-current/10"
                    disabled={draft === 0}
                    onClick={() => setDraft(0)}
                    type="button"
                  >
                    <RotateCcw size={14} />
                  </button>
                  {[...STEPS].reverse().map((step) => (
                    <button
                      className="rounded-full border border-current/10 px-3 py-2 font-mono text-xs"
                      key={`plus-${step}`}
                      onClick={() => setDraft(clamp(draft + step))}
                      type="button"
                    >
                      +{step}ms
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <FoliaGlobalLyricOffsetRuler
                    accentColor={theme.accentColor}
                    ariaLabel={t("folia.offset.title")}
                    limitMs={LIMIT_MS}
                    onChange={setDraft}
                    secondaryColor={theme.secondaryColor}
                    valueMs={draft}
                  />
                </div>
                <p className="mt-3 text-center text-xs opacity-45">
                  {draft === applied
                    ? t("folia.offset.applied")
                    : t("folia.offset.pending", { applied })}
                </p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

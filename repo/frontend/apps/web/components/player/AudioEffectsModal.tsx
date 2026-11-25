"use client";

import { useId, useRef, type CSSProperties } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useTranslation } from "react-i18next";
import { FoliaToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import {
  kitMotionTokens,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";
import {
  FoliaPanelThemeContext,
  settingsTokens,
} from "@scopify/ui/scopify/components/folia-panel/tokens";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";

import { AudioEqualizerPanel } from "@/components/player/AudioEqualizerPanel";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import type { AudioEffectsModalProps } from "@/types/audio/settingsDialogComponents";

/** Folia's size-L audio effects sheet, shared between the lyrics stage and PlayBar. */
export function AudioEffectsModal({
  open,
  onOpenChange,
  daylight,
  colors,
  returnFocusRef,
}: AudioEffectsModalProps) {
  const { t } = useTranslation();
  const enabled = useAudioEqualizerStore((state) => state.settings.enabled);
  const setEnabled = useAudioEqualizerStore((state) => state.setEnabled);
  const reduced = useKitReducedMotion();
  const toggleLabel = useId();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const palette = colors ?? {
    primaryColor: daylight ? "#18181b" : "#f4f4f5",
    accentColor: daylight ? "#2454e8" : "#90adff",
  };
  const style = {
    ...settingsTokens(daylight, palette),
    ...kitMotionTokens(reduced),
    "--st-card": daylight ? "#ffffff" : "#232327",
    "--st-win": daylight ? "#f3f3f4" : "#1a1a1d",
    "--sheet-shadow": daylight ? "0 36px 90px rgba(0,0,0,.26)" : "0 36px 90px rgba(0,0,0,.6)",
    colorScheme: daylight ? "light" : "dark",
  } as CSSProperties;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className="z-[2080] data-[state=closed]:duration-150 data-[state=open]:duration-200 motion-reduce:animate-none"
          style={{ backgroundColor: daylight ? "rgba(24,18,12,.36)" : "rgba(0,0,0,.52)" }}
        />
        <DialogPrimitive.Content
          ref={panel}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            event.preventDefault();
            panel.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(event) => {
            const target = returnFocusRef?.current ?? opener.current;
            if (!target?.isConnected) return;
            event.preventDefault();
            target.focus({ preventScroll: true });
          }}
          style={style}
          className="st-window fixed top-1/2 left-1/2 z-[2081] flex h-[720px] max-h-[calc(100dvh-2rem)] w-[880px] max-w-[calc(100vw-2rem)] -translate-1/2 flex-col overflow-hidden rounded-2xl bg-[var(--st-win)] text-[color:var(--st-t1)] shadow-[var(--sheet-shadow),0_0_0_1px_var(--st-line2)] outline-none data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[98.5%] data-[state=open]:animate-in data-[state=open]:duration-250 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-3 data-[state=open]:zoom-in-[98.5%] motion-reduce:animate-none"
        >
          <FoliaPanelThemeContext.Provider value={{ isDaylight: daylight }}>
            <header className="flex shrink-0 items-start gap-3 pt-4 pr-4 pl-6">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base leading-8 font-semibold">
                  {t("audioEqualizer.title")}
                </DialogTitle>
                <DialogDescription className="-mt-0.5 text-xs leading-[18px] text-[color:var(--st-t2)]">
                  {t("audioEqualizer.description")}
                </DialogDescription>
              </div>
              <div className="flex min-h-8 shrink-0 items-center gap-3">
                <span
                  id={toggleLabel}
                  className="text-xs whitespace-nowrap text-[color:var(--st-t2)] max-sm:sr-only"
                >
                  {t(enabled ? "audioEqualizer.enabled" : "audioEqualizer.disabled")}
                </span>
                <FoliaToggle checked={enabled} onChange={setEnabled} labelledBy={toggleLabel} />
              </div>
              <DialogClose
                aria-label={t("folia.ui.close")}
                className="st-t-fast grid size-8 shrink-0 place-items-center rounded-lg text-[color:var(--st-t2)] transition-[background-color,color] hover:bg-[var(--st-fill)] hover:text-[color:var(--st-t1)]"
              >
                <X size={16} />
              </DialogClose>
            </header>
            <div className="st-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-3 pb-5">
              <AudioEqualizerPanel />
            </div>
          </FoliaPanelThemeContext.Provider>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

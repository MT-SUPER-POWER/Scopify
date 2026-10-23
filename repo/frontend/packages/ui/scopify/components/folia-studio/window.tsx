"use client";

import { motion } from "framer-motion";
import { FoliaStudioHeader } from "@scopify/ui/scopify/components/folia-studio/header";
import { useId, useRef, type CSSProperties, type ReactNode, type Ref } from "react";
import {
  kitMotionTokens,
  kitTransition,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";
import {
  FoliaPanelThemeContext,
  settingsTokens,
  readableAccentColor,
  type FoliaPanelColors,
} from "@scopify/ui/scopify/components/folia-panel/tokens";

// Product extension of the dialog structure: Folia's StudioWindow has a fixed header,
// independently scrolling columns and a smaller nested window. Focus ownership stays with the host.
export function FoliaStudioWindow({
  children,
  header,
  title,
  backLabel,
  onClose,
  isDaylight,
  colors,
  layer = 140,
  panelRef,
  compact = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  title: string;
  backLabel: string;
  onClose: () => void;
  isDaylight: boolean;
  colors: FoliaPanelColors;
  layer?: number;
  panelRef?: Ref<HTMLElement>;
  compact?: boolean;
}) {
  const titleId = useId();
  const pressedOutside = useRef(false);
  const reduced = useKitReducedMotion();
  const surface = isDaylight ? "#f3f3f5" : "#1c1c1f";
  const interfaceColors = {
    primaryColor: isDaylight ? "#171b27" : "#f0f0f3",
    accentColor: readableAccentColor(
      colors.accentColor ?? "",
      surface,
      isDaylight ? "#2454e8" : "#90adff",
    ),
  };
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center p-3 backdrop-blur-xl sm:p-5"
      style={{
        zIndex: layer,
        backgroundColor: isDaylight ? "rgba(24,18,12,.36)" : "rgba(0,0,0,.52)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={kitTransition("move", reduced)}
      onPointerDown={(event) => {
        pressedOutside.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && pressedOutside.current) onClose();
      }}
    >
      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-folia-modal-layer={layer}
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={kitTransition("unfold", reduced)}
        className={`st-window folia-studio-window relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl text-[color:var(--st-t1)] shadow-[0_36px_90px_rgba(0,0,0,.5),0_0_0_1px_var(--st-line2)] outline-none ${compact ? "max-w-xl" : "h-[780px] max-w-[1240px]"}`}
        style={
          {
            ...settingsTokens(isDaylight, interfaceColors),
            ...kitMotionTokens(reduced),
            backgroundColor: surface,
            // Window chrome follows appearance; the preview retains the selected lyric colours.
            "--text-primary": isDaylight ? "#171b27" : "#f0f0f3",
            "--text-secondary": "var(--st-t2)",
            "--st-pv": isDaylight ? "#ececef" : "#151517",
            "--st-card": isDaylight ? "#ffffff" : "#28282d",
            colorScheme: isDaylight ? "light" : "dark",
          } as CSSProperties
        }
      >
        <FoliaPanelThemeContext.Provider value={{ isDaylight }}>
          {header ?? (
            <FoliaStudioHeader
              title={title}
              titleId={titleId}
              backLabel={backLabel}
              onBack={onClose}
            />
          )}
          {header ? (
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
          ) : null}
          {children}
        </FoliaPanelThemeContext.Provider>
      </motion.section>
    </motion.div>
  );
}

export function FoliaStudioColumns({ stage, children }: { stage: ReactNode; children: ReactNode }) {
  return (
    <div className="st-scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden">
      <section className="flex min-h-[460px] shrink-0 flex-col gap-4 px-4 pb-6 sm:px-6 lg:min-h-0">
        {stage}
      </section>
      <aside className="flex min-w-0 shrink-0 flex-col border-t border-[var(--st-line)] lg:min-h-0 lg:border-t-0 lg:border-l">
        {children}
      </aside>
    </div>
  );
}

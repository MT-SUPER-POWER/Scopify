"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  KIT_MOTION,
  kitTransition,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";
import {
  POPOVER_GUTTER,
  placePopover,
  type PopoverPlace,
} from "@scopify/ui/scopify/components/folia-panel/popover";
import { useFoliaPanelTheme } from "@scopify/ui/scopify/components/folia-panel/tokens";

// Folia settings kit tooltip (kit/Tooltip.tsx): a small label over the part it wraps, shown after
// the pointer rests on the part and at once when the keyboard reaches it, placed against the screen.

const MAX_WIDTH = 260;

export function FoliaTooltip({
  text,
  className,
  children,
}: {
  /** Without a text there is only the wrapping element. */
  text?: string;
  className?: string;
  children: ReactNode;
}) {
  const { isDaylight } = useFoliaPanelTheme();
  const reduced = useKitReducedMotion();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [shown, setShown] = useState(false);
  const [place, setPlace] = useState<PopoverPlace | null>(null);

  const hide = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setShown(false);
  }, []);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);
  useEffect(() => {
    if (!text) hide();
  }, [text, hide]);
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const label = labelRef.current;
    setPlace(
      shown && anchor && label
        ? placePopover(
            anchor.getBoundingClientRect(),
            { width: label.offsetWidth, height: label.offsetHeight },
            { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
            { side: "over", align: "center" },
          )
        : null,
    );
  }, [shown, text]);
  useEffect(() => {
    if (!shown) return undefined;
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    window.addEventListener("scroll", hide, true);
    window.addEventListener("keydown", hideOnEscape, true);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("keydown", hideOnEscape, true);
    };
  }, [shown, hide]);

  if (!text) return <span className={className}>{children}</span>;

  return (
    <span
      ref={anchorRef}
      className={className}
      onMouseEnter={() => {
        timerRef.current = window.setTimeout(() => setShown(true), KIT_MOTION.tooltipDelay * 1000);
      }}
      onMouseLeave={hide}
      onMouseDown={hide}
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) setShown(true);
      }}
      onBlur={hide}
    >
      {children}
      {typeof document === "undefined"
        ? null
        : createPortal(
            <AnimatePresence>
              {shown ? (
                <motion.span
                  ref={labelRef}
                  role="tooltip"
                  initial={{ opacity: 0 }}
                  animate={
                    place ? { opacity: 1, y: [place.side === "over" ? 4 : -4, 0] } : { opacity: 0 }
                  }
                  exit={{ opacity: 0 }}
                  transition={kitTransition("fast", reduced)}
                  className="pointer-events-none fixed z-210 rounded-md px-2 py-1 text-xs leading-4.5 [overflow-wrap:anywhere] shadow-[0_6px_18px_rgba(0,0,0,0.3)]"
                  style={{
                    left: place?.left ?? 0,
                    ...(place?.bottom === undefined
                      ? { top: place?.top ?? 0 }
                      : { bottom: place.bottom }),
                    maxWidth: Math.min(MAX_WIDTH, window.innerWidth - 2 * POPOVER_GUTTER),
                    width: "max-content",
                    color: isDaylight ? "#ffffff" : "#17171a",
                    backgroundColor: isDaylight ? "#26262b" : "#ececee",
                  }}
                >
                  {text}
                </motion.span>
              ) : null}
            </AnimatePresence>,
            document.body,
          )}
    </span>
  );
}

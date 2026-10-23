"use client";

import { useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

// Folia settings kit motion (src/components/modal/settings/kit/motion.ts): a few durations and
// three easings, written down once. CSS parts read them as the --st-dur-* / --st-ease-* variables
// the panel sets; framer-motion parts take `kitTransition`. With reduced motion every duration is 0.

/** Seconds. */
export const KIT_MOTION = {
  /** A colour change, a control answering a press, a tooltip. */
  fast: 0.12,
  /** Something that travels a short way: a switch's thumb, the mark of a choice, a page coming in. */
  move: 0.22,
  /** Rows, a note or a folded group opening and closing. */
  unfold: 0.3,
  /** Something that is uncovered, or travels from one place to another. */
  show: 0.48,
  /** How long the pointer rests on a part before its tooltip shows. */
  tooltipDelay: 0.4,
} as const;

type CubicBezier = [number, number, number, number];

export const KIT_EASE: Record<"out" | "standard" | "inOut", CubicBezier> = {
  /** Leaves fast and settles softly: for everything that arrives or travels. */
  out: [0.22, 1, 0.36, 1],
  /** Even at both ends: for colour. */
  standard: [0.4, 0, 0.2, 1],
  /** Slow at both ends: for what leaves one place and lands in another. */
  inOut: [0.65, 0, 0.35, 1],
};

const seconds = (value: number, reduced: boolean) => (reduced ? "0s" : `${value}s`);
const bezier = (points: CubicBezier) => `cubic-bezier(${points.join(", ")})`;

/** The vocabulary as CSS variables, for the `style` of the panel surface. */
export const kitMotionTokens = (reduced: boolean): CSSProperties =>
  ({
    "--st-dur-fast": seconds(KIT_MOTION.fast, reduced),
    "--st-dur-move": seconds(KIT_MOTION.move, reduced),
    "--st-dur-unfold": seconds(KIT_MOTION.unfold, reduced),
    "--st-dur-show": seconds(KIT_MOTION.show, reduced),
    "--st-ease-out": bezier(KIT_EASE.out),
    "--st-ease-standard": bezier(KIT_EASE.standard),
    "--st-ease-in-out": bezier(KIT_EASE.inOut),
  }) as CSSProperties;

/** Whether the kit moves at all: the system's reduce-motion preference. */
export const useKitReducedMotion = (): boolean => useReducedMotion() ?? false;

/** A framer-motion transition of the vocabulary. */
export const kitTransition = (duration: "fast" | "move" | "unfold", reduced: boolean) => ({
  duration: reduced ? 0 : KIT_MOTION[duration],
  ease: KIT_EASE.out,
});

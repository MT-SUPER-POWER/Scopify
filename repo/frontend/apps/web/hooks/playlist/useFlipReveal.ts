"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import {
  FLIP_DECODE_LIMIT,
  FLIP_SPREAD,
  FLIP_TOTAL,
  isFlipRevealArmed,
  isFlipRevealKeepingTools,
  startCardFlip,
} from "@/lib/playlist/flipReveal";
import type { CardFlipPlan } from "@/types/playlist/latticeComponents";

/**
 * Decides, once, which cards of a freshly opened wall flip and when. Only cards on screen at that
 * moment take part: the rest of the wall and anything mounted later by panning is plain content.
 *
 * `measure` gives a card's key and its distance from the pane centre (0 to 1), or null when off screen.
 */
export function useFlipReveal<Item>(
  fieldRef: RefObject<HTMLElement | null>,
  items: Item[],
  hasContent: boolean,
  measure: (item: Item) => { key: string; distance: number } | null,
) {
  const reducedMotion = useReducedMotion();
  const [revealing] = useState(() => hasContent && !reducedMotion && isFlipRevealArmed());
  const [toolsFade] = useState(() => revealing && !isFlipRevealKeepingTools());
  const [settled, setSettled] = useState(!revealing);
  const planRef = useRef<CardFlipPlan | null>(null);
  const openGate = useRef<() => void>(() => undefined);
  if (revealing && !planRef.current && items.length > 0) {
    const delays = new Map<string, number>();
    for (const item of items) {
      const card = measure(item);
      if (card) delays.set(card.key, Math.min(card.distance, 1) * FLIP_SPREAD);
    }
    const gate = new Promise<void>((resolve) => {
      openGate.current = resolve;
    });
    planRef.current = { delays, gate };
  }
  const planned = Boolean(planRef.current);
  // The covers are already loading on the hidden faces; hold the skeleton until they can land whole.
  useLayoutEffect(() => {
    if (!planned) return;
    const covers = [
      ...(fieldRef.current?.querySelectorAll<HTMLImageElement>("[data-flipping=true] img") ?? []),
    ];
    const limit = new Promise((resolve) => window.setTimeout(resolve, FLIP_DECODE_LIMIT));
    void Promise.race([Promise.allSettled(covers.map((cover) => cover.decode())), limit]).then(() =>
      openGate.current(),
    );
  }, [fieldRef, planned]);
  useEffect(() => {
    const plan = planRef.current;
    if (!plan) return;
    let timer = 0;
    let stopped = false;
    void plan.gate.then(() => {
      if (stopped) return;
      timer = window.setTimeout(() => {
        plan.delays.clear();
        setSettled(true);
      }, FLIP_TOTAL);
    });
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [planned]);
  return { toolsFade, settled, plan: planRef.current };
}

/** One card's half of the reveal: holds its skeleton face until the wall's gate opens, then turns it over. */
export function useCardFlip(plan: CardFlipPlan | null, key: string) {
  const [flip] = useState(() => {
    const delay = plan?.delays.get(key);
    return plan && delay !== undefined ? { gate: plan.gate, delay } : null;
  });
  const [flipping, setFlipping] = useState(flip !== null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!flipping || !flip) return;
    let animations: Animation[] = [];
    let stopped = false;
    void flip.gate.then(() => {
      const front = frontRef.current;
      const back = backRef.current;
      if (stopped || !front || !back) return;
      animations = startCardFlip(front, back, flip.delay);
      // Cancelling rejects `finished`; only a flip that ran to the end drops the skeleton face.
      Promise.all(animations.map((animation) => animation.finished)).then(
        () => setFlipping(false),
        () => undefined,
      );
    });
    return () => {
      stopped = true;
      animations.forEach((animation) => animation.cancel());
    };
  }, [flip, flipping]);
  return { flipping, frontRef, backRef };
}

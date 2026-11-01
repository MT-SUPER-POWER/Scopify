"use client";

import {
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, type PointerEvent } from "react";

const TILT_SPRING = { stiffness: 150, damping: 20 };

/** Pointer-driven tilt, glare and floor shadow for the receipt; stays outside React renders. */
export function useReceiptTilt(enabled = true) {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(0, TILT_SPRING);
  const rotateY = useSpring(0, TILT_SPRING);
  const glareX = useMotionValue(30);
  const glareY = useMotionValue(10);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 70%), rgb(255 255 255 / 0%) 46%)`;
  const shadowX = useTransform(rotateY, (value) => value * -2.2);
  const shadowY = useTransform(rotateX, (value) => 34 + value * 2);

  function tilt(event: PointerEvent<HTMLElement>) {
    if (!enabled || reducedMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    rotateX.set((0.5 - y) * 14);
    rotateY.set((x - 0.5) * 18);
    glareX.set(x * 100);
    glareY.set(y * 100);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(30);
    glareY.set(10);
  }

  // Zoomed-in reading needs a flat, still slip.
  useEffect(() => {
    if (enabled) return;
    rotateX.set(0);
    rotateY.set(0);
  }, [enabled, rotateX, rotateY]);

  return { glare, reducedMotion, reset, rotateX, rotateY, shadowX, shadowY, tilt };
}

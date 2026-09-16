"use client";

import { animate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { TicketPointerOrigin, TicketReturnAnimation } from "@/types/components/vipSign";

/** Tilt stays outside React's render loop; a captured pointer owns each tear gesture. */
export function useTicketInteraction(onClose: () => void) {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 170, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 170, damping: 24 });
  const pull = useMotionValue(0);
  const direction = useMotionValue(1);
  const directionLocked = useRef(false);
  const [isTorn, setIsTorn] = useState(false);
  const gesture = useRef<TicketPointerOrigin | null>(null);
  const completed = useRef(false);
  const returnAnimation = useRef<TicketReturnAnimation | null>(null);
  const seam = useTransform(pull, [0, 1], [1, 0]);
  const seamOrigin = useTransform(direction, (value) => (value > 0 ? 1 : 0));

  useEffect(
    () => () => {
      returnAnimation.current?.stop();
    },
    [],
  );

  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  function tilt(event: PointerEvent<HTMLElement>) {
    if (reducedMotion || gesture.current || completed.current || event.pointerType !== "mouse")
      return;
    const box = event.currentTarget.getBoundingClientRect();
    rotateX.set((-(event.clientY - box.top - box.height / 2) / box.height) * 9);
    rotateY.set(((event.clientX - box.left - box.width / 2) / box.width) * 12);
  }

  function tear() {
    if (completed.current) return;
    completed.current = true;
    gesture.current = null;
    returnAnimation.current?.stop();
    resetTilt();
    returnAnimation.current = animate(pull, 1, {
      duration: reducedMotion ? 0 : 0.24,
      onComplete: () => setIsTorn(true),
    });
  }

  function start(event: PointerEvent<HTMLElement>) {
    if (completed.current || gesture.current || event.button !== 0 || !event.isPrimary) return;
    if (
      event.target instanceof Element &&
      event.target.closest("a, button:not([data-ticket-tear])")
    )
      return;
    event.preventDefault();
    returnAnimation.current?.stop();
    const initialProgress = pull.get();
    directionLocked.current = initialProgress > 0.001;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!directionLocked.current)
      direction.set(event.clientY < bounds.top + bounds.height / 2 ? 1 : -1);
    const height = event.currentTarget.offsetHeight;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      travel: height + 2 * Math.min(36, height / 10),
      initialProgress,
      axisX: 0,
      axisY: direction.get(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    rotateX.jump(0);
    rotateY.jump(0);
  }

  function move(event: PointerEvent<HTMLElement>) {
    const origin = gesture.current;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    const distance = Math.hypot(dx, dy);
    if (!directionLocked.current && distance > 6) {
      if (Math.abs(dy) > Math.abs(dx) * 0.5) direction.set(dy > 0 ? 1 : -1);
      origin.axisX = dx / distance;
      origin.axisY = dy / distance;
      directionLocked.current = true;
    }
    // Signed displacement keeps reversing the pointer reversible. One screen
    // pixel advances the tear front one pixel, regardless of ticket height.
    const displacement = dx * origin.axisX + dy * origin.axisY;
    pull.set(Math.max(0, Math.min(1, origin.initialProgress + displacement / origin.travel)));
  }

  function release(event: PointerEvent<HTMLElement>, cancelled = false) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && pull.get() >= 0.82) tear();
    else
      returnAnimation.current = animate(pull, 0, { type: "spring", stiffness: 260, damping: 24 });
  }

  return {
    reducedMotion,
    isTorn,
    rotateX,
    rotateY,
    pull,
    direction,
    seam,
    seamOrigin,
    tilt,
    resetTilt,
    tear,
    start,
    move,
    release,
    finish: () => {
      if (completed.current) onClose();
    },
  };
}

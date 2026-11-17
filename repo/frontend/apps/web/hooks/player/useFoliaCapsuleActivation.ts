"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  FoliaCapsulePress,
  UseFoliaCapsuleActivationOptions,
} from "@/types/player/foliaControls";

const EXPAND_DELAY_MS = 20;
const ACTIONS_DELAY_MS = 400;
const COLLAPSE_DELAY_MS = 100;
const TOUCH_DISMISS_MS = 4000;
const TAP_DISTANCE_PX = 8;
const INTERACTIVE_TARGETS = 'button, input, a, [role="button"], [role="slider"]';

export function useFoliaCapsuleActivation({
  controlsRef,
  isPaused,
  isPlayerView,
}: UseFoliaCapsuleActivationOptions) {
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [hoverActions, setHoverActions] = useState(false);
  const [touchActions, setTouchActions] = useState(false);
  const previousPaused = useRef(isPaused);
  const lastPointerWasTouch = useRef(false);
  const press = useRef<FoliaCapsulePress | null>(null);
  const timers = useRef<{ expand?: number; actions?: number; collapse?: number; touch?: number }>(
    {},
  );

  const revealTouchActions = useCallback(() => {
    window.clearTimeout(timers.current.touch);
    setTouchActions(true);
    timers.current.touch = window.setTimeout(() => setTouchActions(false), TOUCH_DISMISS_MS);
  }, []);

  useEffect(() => {
    const justPaused = isPaused && !previousPaused.current;
    previousPaused.current = isPaused;
    if (
      isPlayerView &&
      justPaused &&
      (lastPointerWasTouch.current || window.matchMedia("(pointer: coarse)").matches)
    ) {
      revealTouchActions();
    }
  }, [isPaused, isPlayerView, revealTouchActions]);

  useEffect(() => {
    if (!touchActions) return;
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && controlsRef.current?.contains(event.target)) return;
      window.clearTimeout(timers.current.touch);
      setTouchActions(false);
    };
    window.addEventListener("pointerdown", dismissOutside, true);
    return () => window.removeEventListener("pointerdown", dismissOutside, true);
  }, [controlsRef, touchActions]);

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach((timer) => window.clearTimeout(timer));
  }, []);

  const onPointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    window.clearTimeout(timers.current.collapse);
    timers.current.expand = window.setTimeout(() => setHoverExpanded(true), EXPAND_DELAY_MS);
    if (isPlayerView) {
      timers.current.actions = window.setTimeout(() => setHoverActions(true), ACTIONS_DELAY_MS);
    }
  };
  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    window.clearTimeout(timers.current.expand);
    window.clearTimeout(timers.current.actions);
    timers.current.collapse = window.setTimeout(() => {
      setHoverExpanded(false);
      setHoverActions(false);
    }, COLLAPSE_DELAY_MS);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    lastPointerWasTouch.current = event.pointerType === "touch";
    press.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      wasTouchOpen: touchActions,
      ownControl:
        event.target instanceof Element ? event.target.closest(INTERACTIVE_TARGETS) : null,
    };
    if (lastPointerWasTouch.current) window.clearTimeout(timers.current.touch);
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || start.pointerId !== event.pointerId || start.pointerType !== "touch") return;
    const tapped = Math.hypot(event.clientX - start.x, event.clientY - start.y) <= TAP_DISTANCE_PX;
    if (isPlayerView && (touchActions || tapped)) revealTouchActions();
  };
  const onPointerCancel = () => {
    press.current = null;
    if (touchActions) revealTouchActions();
  };

  const mayOpenOnClick = (event: MouseEvent<HTMLElement>) => {
    if (event.detail === 0) return true;
    const start = press.current;
    const target =
      event.target instanceof Element ? event.target.closest(INTERACTIVE_TARGETS) : null;
    return (
      !!start &&
      target === start.ownControl &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) <= TAP_DISTANCE_PX &&
      (start.pointerType !== "touch" || start.wasTouchOpen)
    );
  };

  return {
    hoverExpanded,
    hoverActions,
    touchActions,
    mayOpenOnClick,
    handlers: {
      onPointerEnter,
      onPointerLeave,
      onPointerDownCapture: onPointerDown,
      onPointerUpCapture: onPointerUp,
      onPointerCancelCapture: onPointerCancel,
    },
  };
}

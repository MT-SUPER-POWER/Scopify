"use client";

import { useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";

import { useCinemaScene } from "@/hooks/lyrics/useCinemaScene";
import { useCinemaSceneStore } from "@/store/module/cinemaScene";
import type { CinemaPointerDrag, CinemaSceneSurfaceProps } from "@/types/lyrics/cinema";

const PAN_PER_PIXEL = 0.004;
const PAN_PER_KEY = Math.PI / 36;

export function CinemaSceneSurface({
  active,
  artworkUrl,
  accentColor,
  bridge,
  isChromeHidden,
  preserveScreenDrag,
  onBack,
  children,
}: CinemaSceneSurfaceProps) {
  const { t } = useTranslation();
  const enabled = useCinemaSceneStore((state) => state.enabled);
  const reducedMotion = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<CinemaPointerDrag | null>(null);
  const { status, turn, retry } = useCinemaScene(enabled, containerRef, screenRef, {
    active,
    artworkUrl,
    accentColor,
    bridge,
    reducedMotion,
  });
  const projected = enabled && status === "ready";

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      !projected ||
      !event.isPrimary ||
      event.button !== 0 ||
      !(target instanceof Element) ||
      !event.currentTarget.contains(target)
    ) {
      return;
    }
    if (
      event.defaultPrevented ||
      target.closest("button, a, input, select, textarea, [role='button'], [role='slider']") ||
      (preserveScreenDrag && screenRef.current?.contains(target))
    ) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      captured: false,
    };
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = dragRef.current;
    if (!projected || !pointer || pointer.pointerId !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.captured) {
      if (Math.hypot(dx, dy) < 5) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointer.captured = true;
    }
    turn(dx * PAN_PER_PIXEL, -dy * PAN_PER_PIXEL);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const lookWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!projected || event.target !== event.currentTarget) return;
    switch (event.key) {
      case "ArrowLeft":
        turn(PAN_PER_KEY, 0);
        break;
      case "ArrowRight":
        turn(-PAN_PER_KEY, 0);
        break;
      case "ArrowUp":
        turn(0, PAN_PER_KEY);
        break;
      case "ArrowDown":
        turn(0, -PAN_PER_KEY);
        break;
      case "Home":
        useCinemaSceneStore.getState().recenter();
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      aria-label={projected ? t("folia.scene.cinema") : undefined}
      aria-description={projected ? t("folia.scene.lookAround") : undefined}
      role={projected ? "region" : undefined}
      tabIndex={projected ? 0 : undefined}
      className={`absolute inset-0 overflow-hidden ${projected ? "cursor-grab touch-none select-none active:cursor-grabbing" : ""}`}
      onKeyDown={lookWithKeyboard}
      onLostPointerCapture={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={startDrag}
      onPointerLeave={endDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
    >
      <div
        ref={screenRef}
        className="absolute top-0 left-0 size-full origin-top-left overflow-hidden"
      >
        {children(projected)}
      </div>
      <div
        ref={containerRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-10 ${projected ? "" : "invisible"}`}
      />
      {projected && !isChromeHidden ? (
        <button
          type="button"
          aria-label={t("folia.ui.backToHome")}
          className="absolute top-6 left-6 z-20 flex size-10 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md [-webkit-app-region:no-drag] hover:bg-white/15"
          onClick={onBack}
        >
          <ChevronDown size={20} />
        </button>
      ) : null}
      {enabled && status === "failed" ? (
        <div className="absolute top-6 right-6 z-20 flex flex-wrap items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-xs text-white backdrop-blur-md [-webkit-app-region:no-drag]">
          <span role="status">{t("folia.scene.unavailable")}</span>
          <button type="button" className="underline underline-offset-2" onClick={retry}>
            {t("folia.scene.retry")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

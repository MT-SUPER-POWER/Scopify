"use client";

import { useEffect, useRef } from "react";
import type { TicketCurlProps } from "@/types/components/vipSign";
import styles from "@/components/VipSign/VipSignTicket.module.css";

const STRIPS = 48;

/** Cylindrical paper bend: the untouched rows stay attached below the tear front. */
export function useTicketCurl({ source, progress, direction }: TicketCurlProps) {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const paper = source.current;
    const surface = layer.current;
    if (!paper || !surface) return;
    let height = 0;
    let frame: number | null = null;
    let strips: HTMLDivElement[] = [];
    const update = () => {
      const p = progress.get();
      const curling = p > 0.001;
      paper.style.opacity = curling ? "0" : "1";
      surface.style.visibility = curling ? "visible" : "hidden";
      if (!curling) return;
      const radius = Math.min(36, height / 10);
      const front = p * (height + radius * 2);
      const slice = height / STRIPS;
      const fromTop = direction.get() > 0;
      strips.forEach((strip, index) => {
        const center = (index + 0.5) * slice;
        const localCenter = fromTop ? center : height - center;
        const distance = Math.max(0, front - localCenter);
        const angle = distance / radius;
        // A gently expanding spiral keeps the peeled paper rolled, rather than
        // extending it as a rigid flap once the bend passes 180 degrees.
        const rollRadius = radius + distance * 0.012;
        const localY = distance > 0 ? front - rollRadius * Math.sin(angle) : localCenter;
        const y = fromTop ? localY : height - localY;
        const z = rollRadius * (1 - Math.cos(angle));
        strip.style.transform = `translate3d(0, ${y - slice / 2}px, ${z}px) rotateX(${fromTop ? -angle : angle}rad)`;
        strip.style.setProperty("--curl-shade", String(0.14 - Math.cos(angle) * 0.14));
      });
    };
    const build = () => {
      height = paper.offsetHeight;
      const width = paper.offsetWidth;
      if (!height || !width) return;
      const fragment = document.createDocumentFragment();
      strips = Array.from({ length: STRIPS }, (_, index) => {
        const strip = document.createElement("div");
        strip.className = styles.curlStrip;
        strip.style.height = `${height / STRIPS + 0.5}px`;
        const face = document.createElement("div");
        face.className = styles.curlFront;
        const clone = paper.cloneNode(true) as HTMLDivElement;
        clone.style.cssText = `position:absolute;width:${width}px;height:${height}px;top:${(-index * height) / STRIPS}px;opacity:1;pointer-events:none`;
        clone.querySelectorAll("canvas, [id]").forEach((node) => {
          if (node.tagName === "CANVAS") node.remove();
          else node.removeAttribute("id");
        });
        face.append(clone);
        const back = document.createElement("div");
        back.className = styles.curlBack;
        back.style.backgroundPosition = `center ${(-index * height) / STRIPS}px`;
        strip.append(face, back);
        fragment.append(strip);
        return strip;
      });
      surface.replaceChildren(fragment);
      update();
    };
    const observer = new ResizeObserver(build);
    observer.observe(paper);
    build();
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        update();
      });
    };
    const unsubscribe = progress.on("change", scheduleUpdate);
    const unsubscribeDirection = direction.on("change", scheduleUpdate);
    return () => {
      unsubscribe();
      unsubscribeDirection();
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      paper.style.opacity = "";
      surface.replaceChildren();
    };
  }, [source, progress, direction]);
  return layer;
}

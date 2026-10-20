"use client";

import type { MotionValue } from "framer-motion";
import { type RefObject, useEffect, useState } from "react";

import {
  MAX_VISIBLE_ANGLE,
  computeCurvedTrackLayout,
  placeOnCylinder,
} from "@/lib/marketing/curved-track";

/** 服务端与首帧先按 1440×900 排版，挂载后立即按真实视口重排。 */
const FALLBACK_VIEWPORT = { width: 1440, height: 900 } as const;
/** 偏离正中多少弧度时说明文字淡到最低。 */
const CAPTION_FADE_ANGLE = 0.55;

/**
 * 驱动「带鱼屏」曲面轨道：按视口排版，并随滚动把容器内所有 `[data-arc]`
 * 元素沿圆柱面滑动。直接写 style，避免每帧触发上百个组件重渲染。
 */
export function useCurvedTrack(
  stageRef: RefObject<HTMLElement | null>,
  progress: MotionValue<number>,
  cardCount: number,
) {
  const [layout, setLayout] = useState(() =>
    computeCurvedTrackLayout(FALLBACK_VIEWPORT.width, FALLBACK_VIEWPORT.height, cardCount),
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() =>
      setLayout(computeCurvedTrackLayout(stage.clientWidth, stage.clientHeight, cardCount)),
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [cardCount, stageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const items = Array.from(stage.querySelectorAll<HTMLElement>("[data-arc]"), (element) => ({
      arc: Number(element.dataset.arc),
      element,
      fades: element.dataset.arcFade !== undefined,
    }));

    const apply = (value: number) => {
      const offset = value * layout.travel;
      for (const { arc, element, fades } of items) {
        const { angle, transform } = placeOnCylinder(arc - offset, layout.radius);
        const isHidden = Math.abs(angle) > MAX_VISIBLE_ANGLE;
        element.style.visibility = isHidden ? "hidden" : "visible";
        if (isHidden) continue;
        element.style.transform = transform;
        if (fades) {
          element.style.opacity = String(
            1 - Math.min(1, Math.abs(angle) / CAPTION_FADE_ANGLE) * 0.7,
          );
        }
      }
    };

    apply(progress.get());
    return progress.on("change", apply);
  }, [layout, progress, stageRef]);

  return layout;
}

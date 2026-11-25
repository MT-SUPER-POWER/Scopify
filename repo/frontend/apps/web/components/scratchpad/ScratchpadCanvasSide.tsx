"use client";

import { cn } from "@/lib/utils";

import ScratchpadShape from "./ScratchpadShape";
import { memo, useEffect, useRef, useState } from "react";

import type { CanvasJumpTarget } from "@/types/scratchpad/canvas";
import type { ScratchpadCanvasSideProps } from "@/types/scratchpad/components";

function visibleIdsOf(targets: readonly CanvasJumpTarget[], element: HTMLDivElement): string {
  const top = element.scrollTop;
  const bottom = top + element.clientHeight;
  return targets
    .filter((target) => target.bottom > top && target.top < bottom)
    .map((target) => target.id)
    .join("|");
}

/**
 * 画布右侧导航与操作提示栏：显示分组/分段的滚动位置锚点、定位当前播放按钮以及键盘快捷键说明。
 */
export const ScratchpadCanvasSide = memo(function ScratchpadCanvasSide({
  side,
  targets,
  scrollRef,
  onLocate,
  mark,
}: ScratchpadCanvasSideProps) {
  const [inView, setInView] = useState("");
  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const next = visibleIdsOf(targetsRef.current, element);
      setInView((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    element.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(onScroll);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollRef]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const next = visibleIdsOf(targets, element);
    setInView((current) => (current === next ? current : next));
  }, [scrollRef, targets]);

  const visible = new Set(inView ? inView.split("|") : []);
  const jumpTo = (top: number) => {
    scrollRef.current?.scrollTo({ top: Math.max(0, top - 12), behavior: "smooth" });
  };

  return (
    <aside className="scratchpad-canvas-side">
      {targets.length > 1 && (
        <nav className="scratchpad-jump" aria-label={side.jumpLabel}>
          <span className="scratchpad-side-title">{side.jumpLabel}</span>
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              className={cn(
                "scratchpad-jump-item",
                visible.has(target.id) && "is-in-view",
                target.holdsFocus && "is-current",
              )}

              onClick={() => jumpTo(target.top)}
            >
              <ScratchpadShape
                kind={mark}
                size={9}
                fill="currentColor"
                className="scratchpad-jump-mark"
              />
              <span className="scratchpad-jump-label">{target.label}</span>
              <span className="scratchpad-jump-count">{target.count}</span>
            </button>
          ))}
        </nav>
      )}
      {onLocate && side.locateLabel && (
        <button type="button" className="scratchpad-pill scratchpad-jump-locate" onClick={onLocate}>
          <span>{side.locateLabel}</span>
        </button>
      )}
      <div className="scratchpad-tips" role="note" aria-label={side.tipsLabel}>
        <span className="scratchpad-side-title">{side.tipsLabel}</span>
        {side.tips.map((tip) => (
          <span key={tip.key} className="scratchpad-tip">
            <ScratchpadShape kind={mark} size={7} fill="var(--scratchpad-mark-dark)" />
            <b>{tip.key}</b>
            <span>{tip.label}</span>
          </span>
        ))}
      </div>
    </aside>
  );
});

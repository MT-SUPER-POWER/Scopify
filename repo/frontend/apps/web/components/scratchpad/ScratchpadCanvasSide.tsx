"use client";

import { LocateFixed } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
    <aside className="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-l border-border/60 bg-surface-sunken/40 p-4 lg:flex">
      {targets.length > 1 && (
        <nav aria-label={side.jumpLabel} className="space-y-1.5">
          <h3 className="px-2 text-[11px] font-semibold tracking-wider text-content-muted uppercase">
            {side.jumpLabel}
          </h3>
          <div className="space-y-0.5">
            {targets.map((target) => {
              const isVisible = visible.has(target.id);
              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => jumpTo(target.top)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                    isVisible
                      ? "bg-content/10 font-medium text-content"
                      : "text-content-muted hover:bg-content/6 hover:text-content",
                    target.holdsFocus && "ring-1 ring-brand/35",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {target.holdsFocus && (
                      <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                    )}
                    <span className="truncate">{target.label}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-content-muted tabular-nums">
                    {target.count}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {onLocate && side.locateLabel && (
        <button
          type="button"
          onClick={onLocate}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-surface-raised px-3 py-2 text-xs font-medium text-content shadow-xs transition-colors hover:bg-content/6"
        >
          <LocateFixed className="size-3.5 text-brand" />
          <span>{side.locateLabel}</span>
        </button>
      )}

      <div
        role="note"
        aria-label={side.tipsLabel}
        className="mt-auto space-y-2 rounded-xl border border-border/60 bg-surface-raised/60 p-3"
      >
        <h3 className="text-[11px] font-semibold tracking-wider text-content-muted uppercase">
          {side.tipsLabel}
        </h3>
        <ul className="space-y-2">
          {side.tips.map((tip) => (
            <li key={tip.key} className="flex items-start justify-between gap-2 text-xs">
              <kbd className="shrink-0 rounded-md border border-border/80 bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] font-medium text-content">
                {tip.key}
              </kbd>
              <span className="text-right leading-tight text-content-muted">{tip.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
});

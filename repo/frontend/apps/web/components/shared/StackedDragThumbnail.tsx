"use client";

import { cn } from "@/lib/utils";
import type { StackedDragThumbnailProps } from "@/types/sortableList";

export function StackedDragThumbnail({
  cover,
  title,
  subtitle,
  count = 1,
}: StackedDragThumbnailProps) {
  const isMulti = count > 1;

  return (
    <div className="relative isolate">
      {/* 多选时的底层叠层效果 */}
      {isMulti && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 translate-1.5 rotate-2 rounded-md bg-surface-elevated/80 shadow-md ring-1 ring-content/10 backdrop-blur-xs"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 -translate-x-1 translate-y-0.5 -rotate-1 rounded-md bg-surface-elevated/90 shadow-md ring-1 ring-content/10 backdrop-blur-xs"
          />
        </>
      )}

      {/* 主卡片内容 */}
      <div className="flex h-11 w-50 items-center gap-2 rounded-md bg-surface-elevated p-1.5 shadow-xl ring-1 ring-brand/60">
        {cover ? (
          <img
            src={cover}
            alt=""
            draggable={false}
            className="size-8 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="size-8 shrink-0 rounded bg-content/10" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{title}</p>
          {subtitle && <p className="truncate text-[10px] text-content-muted">{subtitle}</p>}
        </div>
      </div>

      {/* 左上角圆形数量角标 */}
      {isMulti && (
        <span
          className={cn(
            "absolute -top-2 -left-2 z-30 flex size-5.5 items-center justify-center",
            "rounded-full bg-brand text-[11px] font-bold text-brand-foreground shadow-md",
            "ring-2 ring-surface-elevated transition-transform",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

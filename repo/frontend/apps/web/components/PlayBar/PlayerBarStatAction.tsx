"use client";

import { LoaderCircle, RotateCw } from "lucide-react";
import Link from "next/link";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { cn, formatCompactCount } from "@/lib/utils";
import type { PlayerBarStatActionProps } from "@/types/components/player";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

/** 图标右上角数字（PlayerBar 专用） */
export function PlayerBarStatAction({
  count,
  countClassName,
  onClick,
  onRetry,
  href,
  retryLabel,
  shortcutCommandId,
  statsStatus = "idle",
  title,
  children,
}: PlayerBarStatActionProps) {
  const isLoading = count === undefined && statsStatus === "loading";
  const isUnavailable =
    count === undefined && (statsStatus === "failed" || statsStatus === "partial");
  const body = (
    <div className="relative inline-flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
      {/* 修复点 1：把 children（图标）显式包裹并设为 z-0，强制将其压在底层 */}
      <div className="relative z-0 flex items-center justify-center">{children}</div>

      {count != null && count > 0 ? (
        <span
          className={cn(
            // 修复点 2：将无效的 z-80 改为标准的 z-10
            "absolute top-0 right-0 z-10 translate-x-[63%] -translate-y-1/3",
            // 修复点 3：加上 transform-gpu 开启 3D 硬件加速，彻底解决 scale 动画和毛玻璃冲突的 Bug
            "transform-gpu",
            "flex min-w-4 items-center justify-center rounded-full border border-border bg-surface-overlay/80 px-1 py-px text-content shadow-sm backdrop-blur-md",
            "pointer-events-none text-[9px] leading-none font-bold whitespace-nowrap tabular-nums",
            countClassName,
          )}
        >
          {formatCompactCount(count)}
        </span>
      ) : isLoading ? (
        <LoaderCircle
          aria-label={title}
          className="absolute top-0 right-0 size-3.5 translate-x-[42%] translate-y-[-42%] animate-spin text-content-muted"
        />
      ) : null}
    </div>
  );

  const className = "shrink-0 py-1 pr-2 cursor-pointer hover:opacity-90 transition-opacity";

  const action = href ? (
    <Link href={href} aria-label={title} onClick={onClick} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" aria-label={title} onClick={onClick} className={className}>
      {body}
    </button>
  );

  const retryAction =
    isUnavailable && onRetry ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={retryLabel}
            className="absolute top-0 right-1 z-20 flex size-3.5 translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full border border-border bg-surface text-content-muted transition-colors hover:text-content"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRetry();
            }}
          >
            <RotateCw className="size-2.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {retryLabel}
        </TooltipContent>
      </Tooltip>
    ) : null;

  if (!title)
    return (
      <div className="group relative shrink-0">
        {action}
        {retryAction}
      </div>
    );

  return (
    <TooltipProvider>
      <div className="group relative shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>{action}</TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <ShortcutHint commandId={shortcutCommandId} label={title} />
          </TooltipContent>
        </Tooltip>
        {retryAction}
      </div>
    </TooltipProvider>
  );
}

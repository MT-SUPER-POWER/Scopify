"use client";

import { motion } from "motion/react";
import { memo } from "react";

import { cn } from "@scopify/ui/shadcn/lib/utils";
import type { PlayingIndicatorProps } from "@scopify/ui/scopify/types/components";

export type { PlayingIndicatorProps } from "@scopify/ui/scopify/types/components";

const BAR_KEYFRAMES = [0.3, 1, 0.45, 0.8, 0.3];

export const PlayingIndicator = memo(function PlayingIndicator({
  ariaLabel,
  className,
  size = 14,
}: PlayingIndicatorProps) {
  return (
    <span
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      className={cn("text-brand flex shrink-0 items-end justify-center gap-[12%]", className)}
      style={{ height: size, width: size }}
    >
      {[0, 0.12, 0.24].map((delay) => (
        <motion.span
          key={delay}
          aria-hidden
          animate={{ scaleY: BAR_KEYFRAMES }}
          className="h-full flex-1 origin-bottom rounded-full bg-current"
          transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, delay }}
        />
      ))}
    </span>
  );
});

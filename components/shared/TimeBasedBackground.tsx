"use client";

import { getTimeTheme } from "@/hooks/home/useHomeData";
import { cn } from "@/lib/utils";

interface TimeBasedBackgroundProps {
  className?: string;
}

export function TimeBasedBackground({ className }: TimeBasedBackgroundProps) {
  const theme = getTimeTheme();

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-0 h-full bg-linear-to-b",
        theme.gradient,
        className,
      )}
    />
  );
}

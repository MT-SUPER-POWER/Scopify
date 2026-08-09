import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MediaInfoBadgeProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  title?: string;
  tone?: "gold" | "red";
}

export function MediaInfoBadge({
  ariaLabel,
  children,
  className,
  title,
  tone = "red",
}: MediaInfoBadgeProps) {
  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-3.25 shrink-0 items-center rounded-xs border px-[2px] text-[9px] leading-[11px] font-normal",
        tone === "gold"
          ? "border-warning bg-warning/10 text-warning"
          : "border-danger bg-danger/10 text-danger",
        className,
      )}
      title={title}
    >
      {children}
    </span>
  );
}

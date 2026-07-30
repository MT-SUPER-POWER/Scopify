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
        "inline-flex h-3.25 shrink-0 items-center rounded-[1px] border px-[2px] text-[9px] leading-[11px] font-normal",
        tone === "gold"
          ? "border-[#a67d16] bg-[#c4931c]/10 text-[#dfb42b]"
          : "border-[#9c4141] bg-[#c24c4c]/8 text-[#d86666]",
        className,
      )}
      title={title}
    >
      {children}
    </span>
  );
}

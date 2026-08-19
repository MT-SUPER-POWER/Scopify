import type { ReactNode } from "react";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { cn } from "@scopify/ui/shadcn/lib/utils";

export type MediaBadgeTone = "gold" | "red" | "brand" | "neutral";

export interface MediaBadgeProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  title?: string;
  tone?: MediaBadgeTone;
}

/** Compact product-semantic metadata used beside media titles and controls. */
export function MediaBadge({
  ariaLabel,
  children,
  className,
  title,
  tone = "red",
}: MediaBadgeProps) {
  return (
    <Badge
      variant="outline"
      aria-label={ariaLabel}
      title={title}
      className={cn(
        "h-3.5 shrink-0 rounded-xs border px-1 py-0 text-[9px] leading-none font-semibold select-none",
        tone === "gold" && "border-warning/45 bg-warning/10 text-warning",
        tone === "red" && "border-danger/45 bg-danger/10 text-danger",
        tone === "brand" && "border-brand/45 bg-brand/10 text-brand",
        tone === "neutral" && "border-border bg-content/5 text-content-muted",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

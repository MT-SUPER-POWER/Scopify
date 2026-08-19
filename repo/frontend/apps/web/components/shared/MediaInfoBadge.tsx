import type { ReactNode } from "react";
import { Badge } from "@scopify/ui/shadcn/components/badge";
import { cn } from "@/lib/utils";

export type MediaInfoBadgeTone = "gold" | "red" | "brand" | "neutral";

interface MediaInfoBadgeProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  title?: string;
  tone?: MediaInfoBadgeTone;
}

export function MediaInfoBadge({
  ariaLabel,
  children,
  className,
  title,
  tone = "red",
}: MediaInfoBadgeProps) {
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

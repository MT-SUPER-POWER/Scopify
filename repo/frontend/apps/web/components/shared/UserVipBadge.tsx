import { Crown } from "lucide-react";
import { hasVipMembership } from "@/lib/vip";
import { cn } from "@/lib/utils";

interface UserVipBadgeProps {
  vipType: number | null | undefined;
  className?: string;
}

export function UserVipBadge({ vipType, className }: UserVipBadgeProps) {
  if (!hasVipMembership(vipType)) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded border border-amber-300/45 bg-amber-300/12 px-1.5 py-0.5 text-[10px] leading-none font-bold text-amber-100",
        className,
      )}
      title="VIP"
      aria-label="VIP"
    >
      <Crown className="size-3" aria-hidden="true" />
      VIP
    </span>
  );
}

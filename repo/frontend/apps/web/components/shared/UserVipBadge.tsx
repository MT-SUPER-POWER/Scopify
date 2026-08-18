import { Crown } from "lucide-react";
import { Badge } from "@scopify/ui/shadcn/components/badge";
import { hasVipMembership } from "@/lib/vip";
import { cn } from "@/lib/utils";

interface UserVipBadgeProps {
  vipType: number | null | undefined;
  className?: string;
}

export function UserVipBadge({ vipType, className }: UserVipBadgeProps) {
  if (!hasVipMembership(vipType)) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-xs border-warning/45 bg-warning/10 px-1.5 py-0.5 text-[10px] leading-none font-bold text-warning select-none",
        className,
      )}
      title="VIP"
      aria-label="VIP"
    >
      <Crown className="size-3" aria-hidden="true" />
      VIP
    </Badge>
  );
}

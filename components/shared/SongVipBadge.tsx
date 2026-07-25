import { Crown } from "lucide-react";
import { isPaidSong } from "@/lib/vip";
import { cn } from "@/lib/utils";

interface SongVipBadgeProps {
  fee: number | null | undefined;
  className?: string;
}

export function SongVipBadge({ fee, className }: SongVipBadgeProps) {
  if (!isPaidSong(fee)) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded border border-amber-300/40 bg-amber-300/10 px-1 py-px text-[9px] leading-none font-bold text-amber-200",
        className,
      )}
      title="VIP"
      aria-label="VIP"
    >
      <Crown className="size-2.5" aria-hidden="true" />
      VIP
    </span>
  );
}

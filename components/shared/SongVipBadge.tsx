import { isVipSong } from "@/lib/vip";
import { cn } from "@/lib/utils";

interface SongVipBadgeProps {
  fee: number | null | undefined;
  className?: string;
}

export function SongVipBadge({ fee, className }: SongVipBadgeProps) {
  if (!isVipSong(fee)) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border border-red-400/50 bg-red-500/10 px-1 py-px text-[10px] leading-none font-medium text-red-300",
        className,
      )}
      title="VIP"
      aria-label="VIP"
    >
      VIP
    </span>
  );
}

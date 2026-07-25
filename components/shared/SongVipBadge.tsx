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
        "inline-flex h-[13px] shrink-0 items-center rounded-[1px] border border-[#9c4141] bg-[#c24c4c]/8 px-[2px] text-[9px] leading-[11px] font-normal text-[#d86666]",
        className,
      )}
      title="VIP"
      aria-label="VIP"
    >
      VIP
    </span>
  );
}

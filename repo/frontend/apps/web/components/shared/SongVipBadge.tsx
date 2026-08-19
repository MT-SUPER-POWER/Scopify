import { MediaBadge } from "@scopify/ui/scopify/components/media-badge";
import { isVipSong } from "@/lib/vip";

interface SongVipBadgeProps {
  fee: number | null | undefined;
  className?: string;
}

export function SongVipBadge({ fee, className }: SongVipBadgeProps) {
  if (!isVipSong(fee)) return null;

  return (
    <MediaBadge ariaLabel="VIP" className={className} title="VIP">
      VIP
    </MediaBadge>
  );
}

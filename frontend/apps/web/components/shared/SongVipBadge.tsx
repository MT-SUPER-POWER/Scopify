import { MediaInfoBadge } from "@/components/shared/MediaInfoBadge";
import { isVipSong } from "@/lib/vip";

interface SongVipBadgeProps {
  fee: number | null | undefined;
  className?: string;
}

export function SongVipBadge({ fee, className }: SongVipBadgeProps) {
  if (!isVipSong(fee)) return null;

  return (
    <MediaInfoBadge ariaLabel="VIP" className={className} title="VIP">
      VIP
    </MediaInfoBadge>
  );
}

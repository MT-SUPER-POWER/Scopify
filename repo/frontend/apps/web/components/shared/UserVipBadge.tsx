import { MediaInfoBadge } from "@/components/shared/MediaInfoBadge";
import { hasVipMembership } from "@/lib/vip";
import type { UserVipBadgeProps } from "@/types/components/userVipBadge";

export function UserVipBadge({ vipType, className }: UserVipBadgeProps) {
  if (!hasVipMembership(vipType)) return null;

  return (
    <MediaInfoBadge ariaLabel="VIP" className={className} title="VIP" tone="red">
      VIP
    </MediaInfoBadge>
  );
}

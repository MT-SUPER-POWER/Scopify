"use client";

import { SongQualityBadge } from "@/components/shared/SongQualityBadge";
import { SongMvBadge } from "@/components/shared/SongMvBadge";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import type { PlayerTrack } from "@/types/player/model";
import type { SongQualityBadgeLevel } from "@/types/song/quality";

/** How the neutral quality tiers read in the badge that NetEase's quality levels also use. */
const NEUTRAL_QUALITY_LEVELS = {
  lossless: "lossless",
  hires: "hires",
  spatial: "vivid",
  dolby: "dolby",
} as const satisfies Record<string, SongQualityBadgeLevel>;

/** The VIP mark of a track, from NetEase's fee or from the platform-neutral flag. */
export function TrackVipBadge({ track, className }: { track: PlayerTrack; className?: string }) {
  // NetEase's `fee` is 1 for VIP songs; other platforms say so with `requiresVip`.
  const fee = track.netease ? track.netease.fee : track.requiresVip ? 1 : undefined;
  return <SongVipBadge fee={fee} className={className} />;
}

/** The quality mark of a track, from NetEase's privilege or from the neutral best quality. */
export function TrackQualityBadge({
  track,
  className,
}: {
  track: PlayerTrack;
  className?: string;
}) {
  const level = track.netease
    ? track.netease.privilege?.maxBrLevel
    : track.bestQuality
      ? NEUTRAL_QUALITY_LEVELS[track.bestQuality]
      : undefined;
  return <SongQualityBadge qualityLevel={level} className={className} />;
}

/** The MV mark of a track, from NetEase's MV ID or from the platform-neutral one. */
export function TrackMvBadge({
  track,
  onNavigate,
}: {
  track: PlayerTrack;
  onNavigate?: () => void;
}) {
  const mvId = track.netease ? track.netease.mv : track.mvId;
  return <SongMvBadge mvId={mvId} onNavigate={onNavigate} />;
}

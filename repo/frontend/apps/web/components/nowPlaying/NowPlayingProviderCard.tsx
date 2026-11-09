"use client";

import Image from "next/image";
import { NowPlayingProviderMv } from "@/components/nowPlaying/NowPlayingProviderMv";
import { TrackMvBadge, TrackQualityBadge, TrackVipBadge } from "@/components/shared/TrackBadges";
import { useTrackLabels } from "@/hooks/song/useTrackInsights";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import type { PlayerTrack } from "@/types/player/model";

/**
 * The now-playing panel of a platform whose songs have no NetEase detail: the cover, the
 * name and artists, the VIP, quality and MV marks, and the tags the platform gives the song.
 */
export function NowPlayingProviderCard({ track }: { track: PlayerTrack }) {
  const labels = useTrackLabels(track.ref);
  const artwork = resolveCoverUrl(track.album?.coverUrl ?? undefined);
  const artists = track.artists.map((artist) => artist.name).join(" / ");

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl bg-surface-elevated shadow-panel">
        {artwork && (
          <Image
            fill
            sizes="480px"
            src={getSizedImageUrl(artwork, 640)}
            alt={track.album?.title ?? track.title}
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-xl font-bold text-content">{track.title}</h3>
          <TrackVipBadge track={track} />
        </div>
        <p className="mt-1 truncate text-sm text-content-muted">{artists}</p>
        <div className="mt-2 flex items-center gap-1">
          <TrackQualityBadge track={track} />
          <TrackMvBadge track={track} />
        </div>
      </div>
      <NowPlayingProviderMv track={track} />
      {labels.data && labels.data.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {labels.data.map((label) => (
            <li
              key={label}
              className="rounded-full bg-content/10 px-3 py-1 text-xs text-content-muted"
            >
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

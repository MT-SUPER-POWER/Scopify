"use client";

import { SongQualityBadge } from "@/components/shared/SongQualityBadge";
import { SongTitleWithAlia } from "@/components/shared/SongTitleWithAlia";
import { SongMvBadge } from "@/components/shared/SongMvBadge";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { TableCell } from "@/components/ui/table";
import { CLOUD_SONG_FALLBACK_COVER } from "@/constants/cloud";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { cn } from "@/lib/utils";
import type { TrackTitleCellProps } from "@/types/playlist/components";
import { getSizedImageUrl } from "@/lib/music/imageUrl";

export function TrackTitleCell({ track, isActive }: TrackTitleCellProps) {
  const smartRouter = useSmartRouter();
  const canOpenArtist = useProviderCapability("artist.read");
  // Aliases, badges and the quality tier are NetEase song fields.
  const extras = track.netease;
  return (
    <TableCell className="max-w-0 min-w-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="size-10 shrink-0 rounded bg-surface-elevated">
          <img
            draggable={false}
            width={40}
            height={40}
            src={getSizedImageUrl(track.album?.coverUrl ?? "", 120) || CLOUD_SONG_FALLBACK_COVER}
            alt={track.album?.title ?? ""}
            decoding="async"
            loading="lazy"
            onError={(event) => {
              const image = event.currentTarget;
              if (!image.src.endsWith(CLOUD_SONG_FALLBACK_COVER))
                image.src = CLOUD_SONG_FALLBACK_COVER;
            }}
            className="size-full rounded object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col truncate">
          <SongTitleWithAlia
            name={track.title}
            alia={extras?.alia}
            className={cn(
              "w-full cursor-pointer text-base font-normal group-hover:underline",
              isActive ? "text-brand" : "text-content",
            )}
          />
          <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
            <SongQualityBadge qualityLevel={extras?.privilege?.maxBrLevel} />
            <SongVipBadge fee={extras?.fee} />
            <SongMvBadge mvId={extras?.mv} />
            <span className="min-w-0 cursor-pointer truncate text-sm font-normal text-content-muted">
              {track.artists.slice(0, 2).map((artist, index, artists) => (
                <span
                  key={`${artist.ref.id}-${index}`}
                  onClick={(event) => {
                    if (!canOpenArtist) return;
                    event.stopPropagation();
                    smartRouter.push(`/artist?id=${artist.ref.id}`);
                  }}
                  title={canOpenArtist ? `/artist?id=${artist.ref.id}` : artist.name}
                  className={cn(canOpenArtist && "hover:text-content hover:underline")}
                  style={{ display: "inline" }}
                >
                  {artist.name}
                  {index < artists.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </TableCell>
  );
}

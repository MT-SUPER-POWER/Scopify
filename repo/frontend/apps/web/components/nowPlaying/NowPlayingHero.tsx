"use client";

import Image from "next/image";
import Link from "next/link";
import { PiHeartBold, PiHeartFill } from "react-icons/pi";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";

/**
 * 面板顶部的大封面与歌曲标题。
 * 封面容器是固定比例的媒体位，后续 MV 播放器直接替换其中内容即可。
 */
export function NowPlayingHero({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const artworkUrl = resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl);
  const isLiked = playback.liked;
  const likeLabel = isLiked ? t("common.action.unlike") : t("common.action.like");

  return (
    <section className="flex flex-col gap-4">
      <div
        data-now-playing-media
        className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-elevated shadow-panel"
      >
        {artworkUrl && (
          <Image
            fill
            sizes="480px"
            src={getSizedImageUrl(artworkUrl, 640)}
            alt={song.al?.name ?? song.name}
            className="object-cover"
          />
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => useUiStore.getState().setIsLyricsOpen(true)}
            className="flex max-w-full min-w-0 items-center gap-2 text-left"
          >
            <span className="truncate text-2xl font-bold text-content hover:underline">
              {song.name}
            </span>
            <SongVipBadge fee={song.fee} />
          </button>
          <p className="mt-1 truncate text-sm text-content-muted">
            {song.ar?.map((artist, index) => (
              <span key={artist.id}>
                {index > 0 && ", "}
                <Link
                  href={`/artist?id=${artist.id}`}
                  scroll={false}
                  className="hover:text-content hover:underline"
                >
                  {artist.name}
                </Link>
              </span>
            ))}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void commands.toggleLike()}
          aria-label={likeLabel}
          title={likeLabel}
          className={cn(
            "mt-1.5 shrink-0 transition-transform hover:scale-110",
            isLiked ? "text-brand" : "text-content-muted hover:text-content",
          )}
        >
          {isLiked ? <PiHeartFill className="size-6" /> : <PiHeartBold className="size-6" />}
        </button>
      </div>
    </section>
  );
}

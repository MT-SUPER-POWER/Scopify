"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { PiHeartBold, PiHeartFill } from "react-icons/pi";
import { NowPlayingDynamicCover } from "./NowPlayingDynamicCover";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";

const ACTION_BTN =
  "flex size-9 shrink-0 items-center justify-center rounded-full transition-all hover:scale-110";

/**
 * 面板顶部通栏的沉浸式封面：有动态封面时播放视频，底部渐隐到面板底色，标题与操作叠在其上。
 * 媒体容器固定比例，后续 MV 播放器直接替换其中内容即可。
 */
export function NowPlayingHero({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const artworkUrl = resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl);
  const isLiked = playback.liked;
  const likeLabel = isLiked ? t("common.action.unlike") : t("common.action.like");

  return (
    <section className="relative -mx-4">
      <div
        data-now-playing-media
        className="relative aspect-square w-full overflow-hidden bg-surface-elevated"
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
        <NowPlayingDynamicCover key={song.id} songId={song.id} isPlaying={playback.isPlaying} />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-surface-sunken"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-4">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => useUiStore.getState().setNowPlayingPanelTab("lyrics")}
            className="flex max-w-full min-w-0 items-center gap-2 text-left"
          >
            <span className="truncate text-2xl font-bold text-content drop-shadow-sm hover:underline">
              {song.name}
            </span>
            <SongVipBadge fee={song.fee} />
          </button>
          <p className="mt-1 truncate text-sm text-content-muted">
            {song.ar?.map((artist, index) => (
              <span key={artist.id || artist.name}>
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
        <Link
          href={`/comment?songId=${song.id}`}
          scroll={false}
          aria-label={t("contextMenu.comments")}
          title={t("contextMenu.comments")}
          className={cn(ACTION_BTN, "text-content-muted hover:text-content")}
        >
          <MessageCircle className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => void commands.toggleLike()}
          aria-label={likeLabel}
          title={likeLabel}
          className={cn(
            ACTION_BTN,
            isLiked ? "text-brand" : "text-content-muted hover:text-content",
          )}
        >
          {isLiked ? <PiHeartFill className="size-6" /> : <PiHeartBold className="size-6" />}
        </button>
      </div>
    </section>
  );
}

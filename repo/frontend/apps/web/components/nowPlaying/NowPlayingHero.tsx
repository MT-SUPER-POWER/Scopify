"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, MessageCircle, MonitorPlay } from "lucide-react";
import { PiHeartBold, PiHeartFill } from "react-icons/pi";
import { NowPlayingDynamicCover } from "./NowPlayingDynamicCover";
import { NowPlayingMvPlayer } from "./NowPlayingMvPlayer";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useSongMvId } from "@/hooks/song/useSongMvId";
import { useNowPlayingMv } from "@/hooks/ui/useNowPlayingMv";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";

const ACTION_BTN =
  "flex size-9 shrink-0 items-center justify-center rounded-full transition-all hover:scale-110";

/**
 * 面板顶部通栏的沉浸式封面：有动态封面时播放视频，底部渐隐到面板底色，标题与操作叠在其上。
 * 歌曲有 MV 时可在同一媒体位切换为 16:9 的 MV 播放器，标题随之移到画面下方。
 */
export function NowPlayingHero({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const songMvId = useSongMvId(song);
  const mv = useNowPlayingMv(song.id);
  const isMvOpen = mv.activeMvId !== null;
  const artworkUrl = resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl);
  const isLiked = playback.liked;
  const likeLabel = isLiked ? t("common.action.unlike") : t("common.action.like");

  return (
    <section className="relative -mx-4">
      <div
        data-now-playing-media
        className={cn(
          "relative w-full overflow-hidden",
          isMvOpen ? "aspect-video bg-black" : "aspect-square bg-surface-elevated",
        )}
      >
        {mv.activeMvId !== null ? (
          <NowPlayingMvPlayer key={mv.activeMvId} mvId={mv.activeMvId} onClose={mv.close} />
        ) : (
          <>
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
              className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-surface-raised dark:to-surface-sunken"
            />
          </>
        )}
      </div>

      <div
        className={cn(
          "flex items-end gap-1 px-4",
          isMvOpen ? "pt-3" : "absolute inset-x-0 bottom-0",
        )}
      >
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
        {(songMvId > 0 || isMvOpen) && (
          <button
            type="button"
            onClick={() => (isMvOpen ? mv.close() : mv.open(songMvId))}
            aria-label={t(isMvOpen ? "nowPlaying.closeMv" : "nowPlaying.watchMv")}
            title={t(isMvOpen ? "nowPlaying.closeMv" : "nowPlaying.watchMv")}
            className={cn(ACTION_BTN, "text-content-muted hover:text-content")}
          >
            {isMvOpen ? <ImageIcon className="size-5" /> : <MonitorPlay className="size-5" />}
          </button>
        )}
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

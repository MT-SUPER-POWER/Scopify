"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { NowPlayingCard } from "./NowPlayingCard";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";

/** 「下一首」：队列中紧随当前歌曲的曲目，点击直接播放，标题旁可打开完整队列。 */
export function NowPlayingNextUp() {
  const { t } = useI18n();
  const commands = usePlaybackCommands();
  const nextIndex = usePlayerStore((s) => s.queueIndex + 1);
  const nextSong = usePlayerStore((s) =>
    s.queueIndex >= 0 ? (s.queue[s.queueIndex + 1] ?? null) : null,
  );
  const coverUrl = nextSong ? resolveCoverUrl(nextSong.al?.picUrl, nextSong.al?.coverUrl) : null;

  return (
    <NowPlayingCard
      title={t("nowPlaying.nextUp")}
      className="pb-2"
      action={
        <button
          type="button"
          onClick={() => useUiStore.getState().setIsQueueOpen(true)}
          className="shrink-0 text-xs font-bold text-content-muted transition-colors hover:text-content hover:underline"
        >
          {t("nowPlaying.openQueue")}
        </button>
      }
    >
      {nextSong ? (
        <button
          type="button"
          onClick={() => void commands.playQueueIndex(nextIndex)}
          className="group mx-2 mt-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-content/5"
        >
          <span className="relative size-12 shrink-0 overflow-hidden rounded bg-surface-elevated">
            {coverUrl && (
              <Image
                fill
                sizes="48px"
                src={getSizedImageUrl(coverUrl, 120)}
                alt={nextSong.name}
                className="object-cover transition-opacity group-hover:opacity-40"
              />
            )}
            <Play className="absolute inset-0 m-auto size-4 fill-current text-content opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-content">{nextSong.name}</span>
            <span className="mt-0.5 block truncate text-xs text-content-muted">
              {nextSong.ar?.map((artist) => artist.name).join(", ")}
            </span>
          </span>
        </button>
      ) : (
        <p className="px-4 py-2 text-sm text-content-subtle">{t("nowPlaying.queueEnd")}</p>
      )}
    </NowPlayingCard>
  );
}

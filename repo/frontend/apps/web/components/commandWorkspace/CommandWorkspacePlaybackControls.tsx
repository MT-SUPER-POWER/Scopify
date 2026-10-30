"use client";

import { Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store";
import { cn } from "@/lib/utils";

export function CommandWorkspacePlaybackControls() {
  const commands = usePlaybackCommands();
  const projection = usePlaybackProjection();
  const isPlaying = projection.isPlaying;
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const setRepeatMode = usePlayerStore((state) => state.setRepeatMode);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
  };
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      {/* 随机播放 */}
      <button
        type="button"
        onClick={toggleShuffle}
        className={cn(
          "rounded-full p-2 transition-colors",
          isShuffle ? "text-brand hover:text-brand" : "text-content-muted hover:text-content",
        )}
        title={isShuffle ? "关闭随机播放" : "开启随机播放"}
        aria-label={isShuffle ? "关闭随机播放" : "开启随机播放"}
      >
        <Shuffle className="size-4" />
      </button>

      {/* 上一首 */}
      <button
        type="button"
        onClick={() => void commands.previous()}
        className="rounded-full p-2 text-content-muted transition-colors hover:bg-content/8 hover:text-content active:scale-95"
        title="上一首"
        aria-label="上一首"
      >
        <SkipBack className="size-5 fill-current" />
      </button>

      {/* 播放/暂停按钮 */}
      <button
        type="button"
        onClick={() => void commands.toggle()}
        className="flex size-12 items-center justify-center rounded-full bg-content text-surface shadow-lg shadow-black/30 transition-all hover:scale-105 hover:bg-content/85 active:scale-95 sm:size-13"
        title={isPlaying ? "暂停" : "播放"}
        aria-label={isPlaying ? "暂停" : "播放"}
      >
        {isPlaying ? (
          <Pause className="size-5 fill-current" />
        ) : (
          <Play className="size-5 translate-x-0.5 fill-current" />
        )}
      </button>

      {/* 下一首 */}
      <button
        type="button"
        onClick={() => void commands.next()}
        className="rounded-full p-2 text-content-muted transition-colors hover:bg-content/8 hover:text-content active:scale-95"
        title="下一首"
        aria-label="下一首"
      >
        <SkipForward className="size-5 fill-current" />
      </button>

      {/* 循环模式 */}
      <button
        type="button"
        onClick={cycleRepeat}
        className={cn(
          "rounded-full p-2 transition-colors",
          repeatMode !== "off"
            ? "text-brand hover:text-brand"
            : "text-content-muted hover:text-content",
        )}
        title={repeatMode === "one" ? "单曲循环" : repeatMode === "all" ? "列表循环" : "顺序播放"}
        aria-label="切换循环模式"
      >
        {repeatMode === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
      </button>

      {/* 喜欢 */}
      <button
        type="button"
        onClick={() => void commands.toggleLike()}
        className={cn(
          "rounded-full p-2 transition-colors",
          projection.liked
            ? "text-red-500 hover:text-red-400"
            : "text-content-muted hover:text-content",
        )}
        title={projection.liked ? "取消喜欢" : "喜欢"}
        aria-label={projection.liked ? "取消喜欢" : "喜欢"}
      >
        <Heart className={cn("size-4.5", projection.liked && "fill-current")} />
      </button>
    </div>
  );
}

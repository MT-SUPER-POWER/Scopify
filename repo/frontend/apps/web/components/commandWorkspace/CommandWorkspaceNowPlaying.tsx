"use client";

import { Heart, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackPosition, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";

export function CommandWorkspaceNowPlaying() {
  const commands = usePlaybackCommands();
  const positionMs = usePlaybackPosition();
  const projection = usePlaybackProjection();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);

  if (!currentSong) {
    return <p className="px-5 py-12 text-center text-sm text-zinc-500">当前没有正在播放的曲目。</p>;
  }

  const durationMs = projection.durationMs || currentSong.dt;
  const volume = projection.volume;
  return (
    <div className="space-y-6 px-5 py-6">
      <div className="min-w-0 text-center">
        <h3 className="truncate text-lg font-bold text-white">{currentSong.name}</h3>
        <p className="truncate text-sm text-zinc-400">
          {currentSong.ar.map((artist) => artist.name).join(" / ")}
        </p>
      </div>
      <div>
        <input
          type="range"
          min={0}
          max={Math.max(durationMs, 1)}
          value={Math.min(positionMs, Math.max(durationMs, 1))}
          onChange={(event) => void commands.seek(Number(event.target.value))}
          className="w-full accent-brand"
          aria-label="播放进度"
        />
        <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
          <span>{formatDuration(positionMs)}</span>
          <span>{formatDuration(durationMs)}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => void commands.previous()}
          className="rounded-full p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
          aria-label="上一首"
        >
          <SkipBack className="size-5 fill-current" />
        </button>
        <button
          type="button"
          onClick={() => void commands.toggle()}
          className="flex size-12 items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200"
          aria-label="播放或暂停"
        >
          {projection.isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </button>
        <button
          type="button"
          onClick={() => void commands.next()}
          className="rounded-full p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
          aria-label="下一首"
        >
          <SkipForward className="size-5 fill-current" />
        </button>
        <button
          type="button"
          onClick={() => void commands.toggleLike()}
          className={
            projection.liked
              ? "rounded-full p-2 text-white hover:bg-white/10"
              : "rounded-full p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
          }
          aria-label="喜欢"
        >
          <Heart className={projection.liked ? "size-5 fill-current" : "size-5"} />
        </button>
      </div>
      <label className="flex items-center gap-3 text-sm text-zinc-400">
        音量
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => void commands.setVolume(Number(event.target.value))}
          className="flex-1 accent-brand"
        />
        <span className="w-8 text-right text-xs tabular-nums">{volume}</span>
      </label>
    </div>
  );
}

"use client";

import {
  Heart,
  Mic2,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SmoothSlider } from "@/components/SmoothSlider";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackPosition, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useUiStore } from "@/store/module/ui";
import type { CommandWorkspaceNowPlayingProps } from "@/types/commandWorkspace";

export function CommandWorkspaceNowPlaying({ onClose }: CommandWorkspaceNowPlayingProps) {
  const router = useRouter();
  const commands = usePlaybackCommands();
  const positionMs = usePlaybackPosition();
  const projection = usePlaybackProjection();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const setRepeatMode = usePlayerStore((state) => state.setRepeatMode);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const toggleLyrics = useUiStore((state) => state.toggleLyrics);

  const [lastNonZeroVolume, setLastNonZeroVolume] = useState<number>(100);

  if (!currentSong) {
    return <p className="px-5 py-16 text-center text-sm text-zinc-500">当前没有正在播放的曲目。</p>;
  }

  const durationMs = projection.durationMs || currentSong.dt;
  const volume = projection.volume;
  const isPlaying = projection.isPlaying;
  const coverUrl = currentSong.al?.picUrl ? `${currentSong.al.picUrl}?param=400y400` : null;

  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  const handleToggleMute = () => {
    if (volume > 0) {
      setLastNonZeroVolume(volume);
      void commands.setVolume(0);
    } else {
      void commands.setVolume(lastNonZeroVolume || 100);
    }
  };

  const navigateToArtist = (artistId: number) => {
    router.push(`/artist?id=${artistId}`, { scroll: false });
    onClose?.();
  };

  const navigateToAlbum = (albumId: number) => {
    router.push(`/album?id=${albumId}`, { scroll: false });
    onClose?.();
  };

  return (
    <div className="relative overflow-hidden p-5 sm:p-6">
      {/* 氛围磨砂背景 */}
      {coverUrl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-10 bg-cover bg-center opacity-12 blur-3xl saturate-150"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : null}

      <div className="relative z-10 space-y-5">
        {/* 顶部：封面与歌曲信息卡片 */}
        <div className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.03] p-3.5 backdrop-blur-md">
          {/* 高清封面 */}
          <button
            type="button"
            onClick={() => void commands.toggle()}
            className="group hover:scale-1.02 relative size-20 shrink-0 overflow-hidden rounded-lg bg-white/8 shadow-md transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:size-24"
            title={isPlaying ? "暂停" : "播放"}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={currentSong.name}
                loading="eager"
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-zinc-500">
                <Music className="size-8" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {isPlaying ? (
                <Pause className="size-6 fill-white text-white" />
              ) : (
                <Play className="size-6 translate-x-0.5 fill-white text-white" />
              )}
            </div>
          </button>

          {/* 歌曲与歌手信息 */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                  isPlaying
                    ? "border border-brand/30 bg-brand/15 text-brand"
                    : "border border-zinc-700/60 bg-zinc-800/60 text-zinc-400",
                )}
              >
                {isPlaying ? (
                  <>
                    <span className="size-1.5 animate-ping rounded-full bg-brand" />
                    正在播放
                  </>
                ) : (
                  "已暂停"
                )}
              </span>
            </div>

            <h3 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
              {currentSong.name}
            </h3>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400">
              {/* 歌手 */}
              <span className="truncate">
                {currentSong.ar?.map((artist, aIndex) => (
                  <span key={`${artist.id || artist.name}-${aIndex}`}>
                    {artist.id ? (
                      <button
                        type="button"
                        onClick={() => navigateToArtist(artist.id)}
                        className="transition-colors hover:text-white hover:underline focus-visible:text-white"
                      >
                        {artist.name}
                      </button>
                    ) : (
                      <span>{artist.name}</span>
                    )}
                    {aIndex < (currentSong.ar?.length ?? 0) - 1 ? " / " : ""}
                  </span>
                ))}
              </span>

              {/* 专辑 */}
              {currentSong.al?.name ? (
                <>
                  <span className="text-zinc-600">·</span>
                  {currentSong.al.id ? (
                    <button
                      type="button"
                      onClick={() => navigateToAlbum(currentSong.al.id)}
                      title={currentSong.al.name}
                      className="max-w-45 truncate transition-colors hover:text-white hover:underline focus-visible:text-white"
                    >
                      {currentSong.al.name}
                    </button>
                  ) : (
                    <span className="max-w-45 truncate">{currentSong.al.name}</span>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* 中间：播放进度条 */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-right font-mono text-[11px] text-zinc-400 tabular-nums">
              {formatDuration(positionMs)}
            </span>
            <SmoothSlider
              ariaLabel="播放进度"
              value={durationMs > 0 ? (positionMs / durationMs) * 100 : 0}
              onChange={(percent, isCommit) => {
                if (durationMs <= 0) return;
                const targetMs = (percent / 100) * durationMs;
                if (isCommit) {
                  void commands.seek(targetMs);
                }
              }}
              trackThickness={4}
              thumbSize={10}
              thumbOnHover={true}
              fillColor="var(--primary)"
              hoverFillColor="var(--primary)"
              className="flex-1"
            />
            <span className="w-10 shrink-0 font-mono text-[11px] text-zinc-400 tabular-nums">
              {formatDuration(durationMs)}
            </span>
          </div>
        </div>

        {/* 核心控制栏 */}
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          {/* 随机播放 */}
          <button
            type="button"
            onClick={toggleShuffle}
            className={cn(
              "rounded-full p-2 transition-colors",
              isShuffle ? "text-brand hover:text-brand" : "text-zinc-400 hover:text-white",
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
            className="rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/8 hover:text-white active:scale-95"
            title="上一首"
            aria-label="上一首"
          >
            <SkipBack className="size-5 fill-current" />
          </button>

          {/* 播放/暂停按钮 */}
          <button
            type="button"
            onClick={() => void commands.toggle()}
            className="flex size-12 items-center justify-center rounded-full bg-white text-zinc-950 shadow-lg shadow-black/30 transition-all hover:scale-105 hover:bg-zinc-100 active:scale-95 sm:size-13"
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
            className="rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/8 hover:text-white active:scale-95"
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
                : "text-zinc-400 hover:text-white",
            )}
            title={
              repeatMode === "one" ? "单曲循环" : repeatMode === "all" ? "列表循环" : "顺序播放"
            }
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
                : "text-zinc-400 hover:text-white",
            )}
            title={projection.liked ? "取消喜欢" : "喜欢"}
            aria-label={projection.liked ? "取消喜欢" : "喜欢"}
          >
            <Heart className={cn("size-4.5", projection.liked && "fill-current")} />
          </button>
        </div>

        {/* 底部工具条：音量控制与歌词快捷入口 */}
        <div className="flex items-center justify-between border-t border-white/6 px-1 pt-3">
          {/* 音量控制 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              className="text-zinc-400 transition-colors hover:text-white"
              title={volume === 0 ? "取消静音" : "静音"}
              aria-label={volume === 0 ? "取消静音" : "静音"}
            >
              {volume === 0 ? (
                <VolumeX className="size-4" />
              ) : volume < 50 ? (
                <Volume1 className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </button>
            <SmoothSlider
              ariaLabel="音量"
              value={volume}
              onChange={(newVol, isCommit) => {
                if (isCommit) {
                  void commands.setVolume(Math.round(newVol));
                }
              }}
              trackThickness={3}
              thumbSize={8}
              thumbOnHover={true}
              fillColor="var(--primary)"
              hoverFillColor="var(--primary)"
              className="w-20 sm:w-24"
            />
            <span className="w-7 text-right font-mono text-[11px] text-zinc-500 tabular-nums">
              {volume}%
            </span>
          </div>

          {/* 歌词入口 */}
          <button
            type="button"
            onClick={() => {
              toggleLyrics();
              onClose?.();
            }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/6 hover:text-white"
            title="打开沉浸式歌词"
          >
            <Mic2 className="size-3.5" />
            <span>歌词</span>
          </button>
        </div>
      </div>
    </div>
  );
}

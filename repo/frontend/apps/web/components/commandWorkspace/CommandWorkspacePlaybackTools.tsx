"use client";

import { Mic2, Volume1, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { SmoothSlider } from "@/components/shared/SmoothSlider";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useUiStore } from "@/store/module/ui";
import type { CommandWorkspaceNowPlayingProps } from "@/types/commandWorkspace/model";

export function CommandWorkspacePlaybackTools({ onClose }: CommandWorkspaceNowPlayingProps) {
  const commands = usePlaybackCommands();
  const volume = usePlaybackProjection().volume;
  const toggleLyrics = useUiStore((state) => state.toggleLyrics);
  const [lastNonZeroVolume, setLastNonZeroVolume] = useState(100);
  const handleToggleMute = () => {
    if (volume > 0) {
      setLastNonZeroVolume(volume);
      void commands.setVolume(0);
    } else void commands.setVolume(lastNonZeroVolume || 100);
  };
  return (
    <div className="flex items-center justify-between border-t border-border px-1 pt-3">
      {/* 音量控制 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleMute}
          className="text-content-muted transition-colors hover:text-content"
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
        <span className="w-7 text-right font-mono text-[11px] text-content-muted tabular-nums">
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
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-content-muted transition-colors hover:bg-content/6 hover:text-content"
        title="打开沉浸式歌词"
      >
        <Mic2 className="size-3.5" />
        <span>歌词</span>
      </button>
    </div>
  );
}

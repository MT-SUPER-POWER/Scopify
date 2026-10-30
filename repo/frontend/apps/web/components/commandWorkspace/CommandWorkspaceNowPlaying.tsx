"use client";

import { CommandWorkspacePlaybackTrack } from "./CommandWorkspacePlaybackTrack";
import { CommandWorkspacePlaybackControls } from "./CommandWorkspacePlaybackControls";
import { CommandWorkspacePlaybackTools } from "./CommandWorkspacePlaybackTools";
import { SmoothSlider } from "@/components/shared/SmoothSlider";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackPosition, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import type { CommandWorkspaceNowPlayingProps } from "@/types/commandWorkspace/model";

export function CommandWorkspaceNowPlaying({ onClose }: CommandWorkspaceNowPlayingProps) {
  const commands = usePlaybackCommands();
  const positionMs = usePlaybackPosition();
  const projection = usePlaybackProjection();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  if (!currentSong) {
    return (
      <p className="px-5 py-16 text-center text-sm text-content-muted">当前没有正在播放的曲目。</p>
    );
  }
  const durationMs = projection.durationMs || currentSong.dt;
  const coverUrl = currentSong.al?.picUrl ? `${currentSong.al.picUrl}?param=400y400` : null;
  return (
    <div className="relative overflow-hidden p-5 sm:p-6">
      {coverUrl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-10 bg-cover bg-center opacity-12 blur-3xl saturate-150"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : null}
      <div className="relative z-10 space-y-5">
        <CommandWorkspacePlaybackTrack onClose={onClose} />
        {/* 中间：播放进度条 */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-right font-mono text-[11px] text-content-muted tabular-nums">
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
            <span className="w-10 shrink-0 font-mono text-[11px] text-content-muted tabular-nums">
              {formatDuration(durationMs)}
            </span>
          </div>
        </div>

        <CommandWorkspacePlaybackControls />
        <CommandWorkspacePlaybackTools onClose={onClose} />
      </div>
    </div>
  );
}

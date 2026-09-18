"use client";

import { VolumeControl } from "@/components/VolumeControl";
import { DesktopPlaybackControllerLauncher } from "@/components/desktopWallpaper/DesktopPlaybackControllerLauncher";
import { DesktopSubtitleControl } from "@/components/player/DesktopSubtitleControl";
import { PersonalFmControlPanel } from "@/components/player/PersonalFmControlPanel";
import { AudioOutputDeviceControl } from "@/components/PlayBar/AudioOutputDeviceControl";
import { AudioSettingsButton } from "@/components/PlayBar/AudioSettingsButton";
import { FullscreenButton } from "@/components/PlayBar/FullscreenButton";
import { LyricStageButton } from "@/components/PlayBar/LyricStageButton";
import { QueuePopoverLauncher } from "@/components/PlayBar/QueuePopoverLauncher";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { cn } from "@/lib/utils";

export function PlayerBarRightControls({ isLyricStageBar = false }: { isLyricStageBar?: boolean }) {
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();

  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 text-content-muted lg:gap-3",
        isLyricStageBar ? "min-w-0" : "flex-1 md:flex-none md:justify-self-end",
      )}
    >
      {/* 桌面歌词控制器 */}
      <DesktopSubtitleControl />

      {/* 桌面音乐控制器 */}
      <DesktopPlaybackControllerLauncher />

      {/* Lyric Stage 开关 */}
      <LyricStageButton />

      {/* 音频设置 */}
      <AudioSettingsButton />

      {!isLyricStageBar && <PersonalFmControlPanel />}

      {/* 播放列表浮层 */}
      <QueuePopoverLauncher />

      {/* 音频输出设备选择 */}
      <div className="hidden lg:block">
        <AudioOutputDeviceControl />
      </div>

      {/* 音量控制 */}
      <VolumeControl
        initialVolume={playback.volume}
        onChange={(nextVolume) => void commands.setVolume(nextVolume)}
      />

      {/* 全屏切换 */}
      <FullscreenButton />
    </div>
  );
}

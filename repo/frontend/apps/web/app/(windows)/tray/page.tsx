"use client";

import { Minimize, MonitorCog, Power, Settings, Wallpaper } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { SongTitle } from "@/components/shared/Marquee";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { VolumeControl } from "@/components/PlayBar/VolumeControl";
import { useTrayPanel } from "@/hooks/desktop/useTrayPanel";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { TrayMenuButtonProps } from "@/types/desktop/trayComponents";
import { TrayLyricSurfaces } from "./_components/TrayLyricSurfaces";
import { TrayPlaybackControls } from "./_components/TrayPlaybackControls";
import { TraySwitchRow } from "./_components/TraySwitchRow";

/** 托盘面板里“图标 + 文案”的菜单行，覆盖 Button 的默认样式让它更像菜单项。 */
function TrayMenuButton({ icon: Icon, label, onClick }: TrayMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      className="h-9 w-full justify-start gap-0 rounded-md px-3 font-normal text-content-muted transition-colors hover:bg-surface-elevated hover:text-content"
      onClick={onClick}
    >
      <Icon className="mr-2 size-4" />
      <span>{label}</span>
    </Button>
  );
}

export default function TrayPage() {
  const { t } = useI18n();
  const {
    mounted,
    isDesktop,
    wallpaper,
    playback,
    controllerOpen,
    playNext,
    playPrev,
    togglePlay,
    toggleLike,
    handleVolumeChange,
    toggleDesktopPlaybackController,
    setDesktopPlaybackWallpaperEnabled,
  } = useTrayPanel();

  if (!mounted) {
    return <div className="size-full" />;
  }

  if (!isDesktop) return null;

  return (
    <main data-tray-content className="size-full bg-background">
      <div className="flex size-full flex-col gap-1 overflow-hidden border border-border bg-surface-overlay p-2 font-sans text-[13px] font-medium text-content select-none">
        {/* 头部：当前歌曲 - 固定 */}
        <SongTitle
          title={`${playback.track?.title || t("common.meta.unknownSong")} - ${playback.track?.artistNames.join(" / ") || t("common.meta.unknownArtist")}`}
        />

        <Separator className="my-1.5 bg-border" />

        {/* 可滚动区域 */}
        <ScrollArea className="flex-1 overflow-x-hidden overflow-y-auto pr-1">
          {/* 播放控制区 - 固定 */}
          <TrayPlaybackControls
            isPlaying={playback.isPlaying}
            liked={playback.liked}
            onPrevious={playPrev}
            onTogglePlay={togglePlay}
            onNext={playNext}
            onToggleLike={toggleLike}
          />

          <Separator className="my-1.5 bg-border" />

          {/* 音量条区 */}
          <VolumeControl
            initialVolume={playback.volume}
            onChange={handleVolumeChange}
            orientation="horizontal"
            variant="inline"
            className="h-9 px-3"
          />

          <Separator className="my-1.5 bg-border" />

          {/* 桌面歌词、灵动岛与任务栏歌词 */}
          <TrayLyricSurfaces />

          <Separator className="my-1.5 bg-border" />

          {/* 桌面动态壁纸 */}
          <TraySwitchRow
            icon={Wallpaper}
            label={t("tray.desktopWallpaper")}
            checked={wallpaper.model?.preferences.enabled ?? false}
            disabled={!wallpaper.model || wallpaper.isPending}
            onToggle={() =>
              void setDesktopPlaybackWallpaperEnabled(!wallpaper.model?.preferences.enabled)
            }
          />

          {/* 桌面音乐控制器 */}
          <TraySwitchRow
            icon={MonitorCog}
            label={t("tray.openDesktopController")}
            checked={controllerOpen}
            onToggle={() => void toggleDesktopPlaybackController()}
          />

          <Separator className="my-1.5 bg-border" />

          {/* 主窗口跳转设置页面 */}
          <TrayMenuButton
            icon={Settings}
            label={t("tray.settings")}
            onClick={() => runtime.navigation.navigateMainWindow("/setting")}
          />

          <Separator className="my-1.5 bg-border" />

          {/* 最小化和退出 */}
          <TrayMenuButton
            icon={Minimize}
            label={t("tray.minimize")}
            onClick={() => runtime.window.minimize()}
          />

          <TrayMenuButton icon={Power} label={t("tray.exit")} onClick={() => runtime.app.exit()} />
        </ScrollArea>
      </div>
    </main>
  );
}

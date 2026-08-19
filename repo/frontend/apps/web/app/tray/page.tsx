"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  Heart,
  MicVocal,
  Minimize,
  MonitorCog,
  Pause,
  Play,
  Power,
  Settings,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SongTitle } from "@/components/Marquee";
// 引入 UI 组件
import { Button } from "@scopify/ui/shadcn/components/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { VolumeControl } from "@/components/VolumeControl";
import { useDesktopPlaybackWallpaperController } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperController";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { LyricData } from "@/types/lyrics";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TrayPage() {
  const smartRouter = useSmartRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const isDesktop = runtime.isDesktop;
  const wallpaper = useDesktopPlaybackWallpaperController();
  const playback = usePlaybackProjection<LyricData>();
  const playbackCommands = usePlaybackCommands();

  const playNext = () => void playbackCommands.next();
  const playPrev = () => void playbackCommands.previous();
  const togglePlay = () => void playbackCommands.toggle();
  const handleVolumeChange = (newVolume: number) => {
    void playbackCommands.setVolume(newVolume);
  };
  const toggleLike = () => void playbackCommands.toggleLike();
  const openDesktopPlaybackController = async () => {
    try {
      if (!(await wallpaper.showController())) {
        toast.error(t("desktopPlaybackController.openFailed"));
      }
    } catch {
      toast.error(t("desktopPlaybackController.openFailed"));
    }
  };
  const setDesktopPlaybackWallpaperEnabled = async (enabled: boolean) => {
    try {
      await wallpaper.configure({ enabled });
    } catch {
      toast.error(t("desktopPlaybackController.updateFailed"));
    }
  };

  // 路由跳转副作用，必须放在所有 Hook 之前
  useEffect(() => {
    if (!isDesktop && typeof window !== "undefined") {
      smartRouter.replace("/");
    }
  }, [isDesktop, smartRouter]);

  // 透明宿主窗口只承载内容卡片，避免原生背景和圆角介入。
  useEffect(() => {
    document.documentElement.classList.add("tray-html");
    document.body.classList.add("tray-body");
    return () => {
      document.documentElement.classList.remove("tray-html");
      document.body.classList.remove("tray-body");
    };
  }, []);

  // 水合问题
  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return <div className="size-full" />;
  }

  if (!isDesktop) return null;

  // 提取公共样式
  const iconClass = "mr-2 size-4";
  // 覆盖 Button 的默认样式，让其更像一个菜单项
  const menuItemClass =
    "h-9 w-full justify-start rounded-md px-3 py-5 font-normal text-content-muted transition-colors hover:bg-surface-elevated hover:text-content";

  return (
    <main className="size-full bg-transparent p-1">
      <div className="flex size-full animate-in flex-col gap-1 overflow-hidden rounded-xl border border-border bg-surface-overlay p-2 font-sans text-[13px] font-medium text-content duration-200 select-none zoom-in-95 fade-in">
        {/* 头部：当前歌曲 - 固定 */}
        <SongTitle
          title={`${playback.track?.title || t("common.meta.unknownSong")} -
        ${playback.track?.artistNames.join(" / ") || t("common.meta.unknownArtist")}`}
        />

        <Separator className="my-1.5 bg-border" />

        {/* 可滚动区域 */}
        <ScrollArea className="flex-1 overflow-x-hidden overflow-y-auto pr-1">
          {/* 播放控制区 - 固定 */}
          <div className="flex shrink-0 items-center justify-between px-4 py-1">
            <button
              className="rounded-full p-1.5 text-content-muted transition-all hover:bg-surface-elevated hover:text-content"
              onClick={playPrev}
              title={t("tray.previous")}
            >
              <SkipBack className="size-5 fill-current" />
            </button>

            <button
              className="rounded-full p-2 text-content-muted transition-all hover:bg-surface-elevated hover:text-content"
              onClick={togglePlay}
              title={playback.isPlaying ? t("tray.pause") : t("tray.play")}
            >
              {/* 修复：这里正确判断并显示 Pause 或 Play 图标 */}
              {playback.isPlaying ? (
                <Pause className="size-6 fill-current" />
              ) : (
                <Play className="size-6 fill-current" />
              )}
            </button>

            <button
              className="rounded-full p-1.5 text-content-muted transition-all hover:bg-surface-elevated hover:text-content"
              onClick={playNext}
              title={t("tray.next")}
            >
              <SkipForward className="size-5 fill-current" />
            </button>
            <button
              className={`rounded-full p-1.5 transition-all ${playback.liked ? "text-brand" : "text-content-muted hover:bg-surface-elevated hover:text-content"}`}
              onClick={toggleLike}
              title={playback.liked ? t("tray.unlike") : t("tray.like")}
            >
              <Heart className={`size-6 ${playback.liked ? "fill-brand" : ""}`} />
            </button>
          </div>

          <Separator className="my-1.5 bg-border" />

          {/* 音量条区 */}
          <VolumeControl
            initialVolume={playback.volume}
            onChange={handleVolumeChange}
            orientation="horizontal"
            variant="inline"
          />

          <Separator className="my-1.5 bg-border" />

          <Button variant="ghost" className={menuItemClass}>
            <MicVocal className={iconClass} />
            {t("tray.openDesktopLyrics")}
          </Button>

          <div className="flex h-10 items-center rounded-md px-3 text-content-muted transition-colors hover:bg-surface-elevated hover:text-content">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center"
              onClick={() => void openDesktopPlaybackController()}
            >
              <MonitorCog className={iconClass} />
              <span className="truncate">{t("desktopPlaybackController.open")}</span>
            </button>
            <Switch
              aria-label={t("desktopPlaybackController.wallpaper")}
              checked={wallpaper.model?.preferences.enabled ?? false}
              disabled={!wallpaper.model || wallpaper.isPending}
              onCheckedChange={(enabled) => void setDesktopPlaybackWallpaperEnabled(enabled)}
            />
          </div>

          <Separator className="my-1.5 bg-border" />

          {/* 主窗口跳转设置页面 */}
          <Button
            variant="ghost"
            className={`${menuItemClass}`}
            onClick={() => runtime.navigation.navigateMainWindow("/setting")}
          >
            <Settings className={iconClass} />
            <span>{t("tray.settings")}</span>
          </Button>

          <Separator className="my-1.5 bg-border" />

          {/* 最小化和退出 */}
          <Button
            variant="ghost"
            className={menuItemClass}
            onClick={() => runtime.window.minimize()}
          >
            <Minimize className={iconClass} />
            <span>{t("tray.minimize")}</span>
          </Button>

          <Button variant="ghost" className={menuItemClass} onClick={() => runtime.app.exit()}>
            <Power className={iconClass} />
            <span>{t("tray.exit")}</span>
          </Button>
        </ScrollArea>
      </div>
    </main>
  );
}

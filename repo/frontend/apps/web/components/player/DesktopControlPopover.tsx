"use client";

import { Captions } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@scopify/ui/shadcn/components/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@scopify/ui/shadcn/components/tooltip";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { useDesktopPlaybackWallpaperController } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperController";
import { useDesktopSubtitleControlSync } from "@/hooks/player/useDesktopSubtitleControlSync";
import { getDesktopPlaybackWallpaperToggleUpdate } from "@/lib/desktopPlaybackWallpaper/toggle";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useAppearanceStore } from "@/store/module/appearance";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useI18n } from "@/store/module/i18n";

/** 桌面小歌词与桌面音乐共用的播放栏入口：一个按钮、一个浮层。 */
export function DesktopControlPopover() {
  const { t } = useI18n();
  const control = useDesktopSubtitleControl();
  const wallpaper = useDesktopPlaybackWallpaperController();
  const showTranslation = useAppearanceStore((state) => state.lyricsPreview.showTranslation);
  const updateLyricsPreview = useAppearanceStore((state) => state.updateLyricsPreview);
  useDesktopSubtitleControlSync();
  if (!runtime.isDesktop) return null;

  const wallpaperModel = wallpaper.model;
  const wallpaperFaulted = wallpaperModel?.status.state === "faulted";
  const active = Boolean(control.preferences?.enabled || wallpaperModel?.preferences.enabled);

  const toggleWallpaper = async () => {
    if (!wallpaperModel || wallpaper.isPending) return;
    try {
      await wallpaper.configure(
        getDesktopPlaybackWallpaperToggleUpdate(wallpaperModel.preferences),
      );
    } catch {
      toast.error(t("desktopPlaybackController.updateFailed"));
    }
  };

  const openController = async () => {
    try {
      if (await wallpaper.showController()) {
        control.setOpen(false);
        return;
      }
    } catch {
      // 与未打开一并提示
    }
    toast.error(t("desktopPlaybackController.openFailed"));
  };

  return (
    <Popover open={control.open} onOpenChange={control.setOpen}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("subtitleControl.popoverTitle")}
                className={cn(
                  "flex items-center justify-center transition-colors",
                  active || control.open ? "text-brand" : "text-content-muted hover:text-content",
                )}
              >
                <Captions className="size-5 stroke-[1.65px] lg:size-6" />
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="top">
            <ShortcutHint
              commandId="toggle-subtitle-controls"
              label={t("subtitleControl.popoverTitle")}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent side="top" align="end" sideOffset={12} className="z-2000 w-80 space-y-4">
        <section className="space-y-4">
          <h3 className="text-base font-semibold">{t("subtitleControl.title")}</h3>
          <div className="flex items-center justify-between gap-3">
            <ShortcutHint
              commandId="toggle-desktop-subtitle"
              label={t("subtitleControl.enabled")}
            />
            <Switch
              aria-label={t("subtitleControl.enabled")}
              checked={Boolean(control.preferences?.enabled)}
              disabled={control.busy || !control.preferences}
              onCheckedChange={() => void control.toggle()}
            />
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t("subtitlePreview.translation")}</span>
            <Switch
              checked={showTranslation}
              onCheckedChange={(value) => updateLyricsPreview({ showTranslation: value })}
            />
          </label>
          {(["alwaysOnTop", "locked"] as const).map((key) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              <span>
                {t(key === "alwaysOnTop" ? "desktopLyrics.keepOnTop" : "desktopLyrics.lock")}
              </span>
              <Switch
                checked={Boolean(control.preferences?.[key])}
                disabled={control.busy || !control.preferences}
                onCheckedChange={(value) => void control.configure({ [key]: value })}
              />
            </label>
          ))}
          {control.failed && (
            <div role="alert" className="space-y-2 text-sm text-danger">
              <p>{t("subtitleControl.failed")}</p>
              <Button size="sm" variant="outline" onClick={() => void control.refresh()}>
                {t("subtitleControl.retry")}
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link
              href="/setting?tab=appearance#subtitle-style"
              onClick={() => control.setOpen(false)}
            >
              {t("subtitleControl.style")}
            </Link>
          </Button>
        </section>

        <section className="space-y-4 border-t border-border pt-4">
          <h3 className="text-base font-semibold">{t("desktopPlaybackController.title")}</h3>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t("desktopPlaybackController.wallpaper")}</span>
            <Switch
              checked={Boolean(wallpaperModel?.preferences.enabled)}
              disabled={!wallpaperModel || wallpaper.isPending}
              onCheckedChange={() => void toggleWallpaper()}
            />
          </label>
          {wallpaperFaulted && (
            <div role="alert" className="space-y-2 text-sm text-danger">
              <p>{t("desktopPlaybackController.statusFaulted")}</p>
              {wallpaperModel?.status.state === "faulted" && wallpaperModel.status.diagnostic && (
                <p className="max-w-70 text-xs break-words text-muted-foreground">
                  {wallpaperModel.status.diagnostic}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={wallpaper.isPending}
                onClick={() => void wallpaper.retry()}
              >
                {t("desktopPlaybackController.retry")}
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void openController()}
          >
            <ShortcutHint
              commandId="toggle-desktop-controller"
              label={t("desktopPlaybackController.open")}
            />
          </Button>
        </section>
      </PopoverContent>
    </Popover>
  );
}

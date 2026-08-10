"use client";

import { Layers3, MonitorCog, Palette, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { DesktopPlaybackWallpaperPreferencesUpdate } from "@scopify/desktop-contract";

import { DesktopPlaybackAppearanceControls } from "@/components/desktopWallpaper/DesktopPlaybackAppearanceControls";
import { DesktopPlaybackPlayerControls } from "@/components/desktopWallpaper/DesktopPlaybackPlayerControls";
import { DesktopPlaybackWallpaperControls } from "@/components/desktopWallpaper/DesktopPlaybackWallpaperControls";
import { useDesktopIconVisibility } from "@/hooks/desktopWallpaper/useDesktopIconVisibility";
import { useDesktopPlaybackWallpaperController } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperController";
import { useRemotePlayerController } from "@/hooks/player/useRemotePlayerController";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { DesktopPlaybackControllerTab } from "@/types/desktopPlaybackWallpaper";

export function DesktopPlaybackController() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<DesktopPlaybackControllerTab>("appearance");
  const player = useRemotePlayerController();
  const desktopIcons = useDesktopIconVisibility();
  const wallpaper = useDesktopPlaybackWallpaperController();

  const configureWallpaper = async (update: DesktopPlaybackWallpaperPreferencesUpdate) => {
    try {
      await wallpaper.configure(update);
    } catch {
      toast.error(t("desktopPlaybackController.updateFailed"));
    }
  };

  const retryWallpaper = async () => {
    try {
      await wallpaper.retry();
    } catch {
      toast.error(t("desktopPlaybackController.updateFailed"));
    }
  };

  const updateDesktopIconVisibility = async (visible: boolean) => {
    try {
      const state = await desktopIcons.setVisible(visible);
      if (!state.supported || state.visible !== visible || state.diagnostic) {
        toast.error(t("desktopPlaybackController.desktopIconsUpdateFailed"));
      }
    } catch {
      toast.error(t("desktopPlaybackController.desktopIconsUpdateFailed"));
    }
  };

  return (
    <main className="bg-surface text-content flex size-full flex-col overflow-hidden border border-white/10 shadow-2xl">
      <header className="border-border flex h-11 shrink-0 items-center border-b px-3 [-webkit-app-region:drag]">
        <MonitorCog className="text-brand size-4" />
        <span className="ml-2 flex-1 text-sm font-semibold">
          {t("desktopPlaybackController.title")}
        </span>
        <button
          type="button"
          aria-label={t("ui.close")}
          className="text-content-muted hover:bg-surface-overlay hover:text-content flex size-8 items-center justify-center transition-colors [-webkit-app-region:no-drag]"
          onClick={() => void wallpaper.closeController()}
        >
          <X className="size-4" />
        </button>
      </header>

      <DesktopPlaybackPlayerControls
        currentSong={player.currentSongDetail}
        isConnected={player.isConnected}
        isPlaying={player.isPlaying}
        onNext={player.playNext}
        onPrevious={player.playPrevious}
        onTogglePlaying={player.togglePlaying}
        onVolumeChange={player.setVolume}
        volume={player.volume}
      />

      <nav
        className="border-border grid h-11 shrink-0 grid-cols-2 border-b px-3"
        aria-label={t("desktopPlaybackController.title")}
      >
        <ControllerTabButton
          active={activeTab === "appearance"}
          icon={<Palette className="size-3.5" />}
          label={t("desktopPlaybackController.appearanceTab")}
          onClick={() => setActiveTab("appearance")}
        />
        <ControllerTabButton
          active={activeTab === "wallpaper"}
          icon={<Layers3 className="size-3.5" />}
          label={t("desktopPlaybackController.wallpaperTab")}
          onClick={() => setActiveTab("wallpaper")}
        />
      </nav>

      <div className="min-h-0 flex-1">
        {activeTab === "appearance" ? (
          <DesktopPlaybackAppearanceControls />
        ) : (
          <DesktopPlaybackWallpaperControls
            desktopIconVisibility={desktopIcons.state}
            isDesktopIconPending={desktopIcons.isPending}
            isPending={wallpaper.isPending}
            model={wallpaper.model}
            onConfigure={configureWallpaper}
            onDesktopIconVisibilityChange={updateDesktopIconVisibility}
            onRetry={retryWallpaper}
          />
        )}
      </div>
    </main>
  );
}

function ControllerTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "relative flex items-center justify-center gap-2 text-xs transition-colors",
        active ? "text-content" : "text-content-muted hover:text-content",
      )}
      onClick={onClick}
    >
      {icon}
      {label}
      <span
        className={cn(
          "bg-brand absolute inset-x-4 bottom-0 h-0.5 transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

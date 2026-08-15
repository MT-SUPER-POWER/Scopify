"use client";

import { Layers3, Palette } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type {
  DesktopPlaybackControllerLayout,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopify/desktop-contract";

import { DesktopPlaybackAppearanceControls } from "@/components/desktopWallpaper/DesktopPlaybackAppearanceControls";
import { DesktopPlaybackControllerHeader } from "@/components/desktopWallpaper/DesktopPlaybackControllerHeader";
import { DesktopPlaybackControllerQuickToggle } from "@/components/desktopWallpaper/DesktopPlaybackControllerQuickToggle";
import { DesktopPlaybackControllerShortcutHandler } from "@/components/desktopWallpaper/DesktopPlaybackControllerShortcutHandler";
import { DesktopPlaybackPlayerControls } from "@/components/desktopWallpaper/DesktopPlaybackPlayerControls";
import { DesktopPlaybackWallpaperControls } from "@/components/desktopWallpaper/DesktopPlaybackWallpaperControls";
import { useDesktopIconVisibility } from "@/hooks/desktopWallpaper/useDesktopIconVisibility";
import { useDesktopWallpaperFoliaPlayback } from "@/hooks/desktopWallpaper/useDesktopWallpaperFoliaPlayback";
import { useDesktopPlaybackWallpaperController } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperController";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { requestDesktopPlaybackControllerThemeEditor } from "@/lib/desktopPlaybackWallpaper/controllerThemeEditor";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { DesktopPlaybackControllerTab } from "@/types/desktopPlaybackWallpaper";

export function DesktopPlaybackController() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<DesktopPlaybackControllerTab>("appearance");
  const [layout, setLayout] = useState<DesktopPlaybackControllerLayout>("compact");
  const [isLayoutPending, setIsLayoutPending] = useState(false);
  const playbackCommands = usePlaybackCommands();
  const desktopIcons = useDesktopIconVisibility();
  const wallpaper = useDesktopPlaybackWallpaperController();
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const foliaPlayback = useDesktopWallpaperFoliaPlayback(lyricOffsetMs);
  const isExpanded = layout === "expanded";
  const activeLineIndex = foliaPlayback.bridge.currentLineIndex;
  const activeLine = foliaPlayback.bridge.lines[activeLineIndex] ?? null;
  const nextLine = foliaPlayback.bridge.lines[activeLineIndex + 1] ?? null;
  const activeLyric = activeLine
    ? {
        primary: activeLine.fullText,
        secondary: activeLine.translation ?? activeLine.romanization ?? nextLine?.fullText,
      }
    : null;
  const { projection, track } = foliaPlayback;
  useEffect(() => {
    document.documentElement.classList.add("desktop-playback-controller-html");
    document.body.classList.add("desktop-playback-controller-body");
    setLayout(window.innerHeight >= 400 ? "expanded" : "compact");
    return () => {
      document.documentElement.classList.remove("desktop-playback-controller-html");
      document.body.classList.remove("desktop-playback-controller-body");
    };
  }, []);

  const configureWallpaper = async (update: DesktopPlaybackWallpaperPreferencesUpdate) => {
    try {
      await wallpaper.configure(update);
    } catch {
      toast.error(t("desktopPlaybackController.updateFailed"));
    }
  };

  const setWallpaperEnabled = (enabled: boolean) => {
    const preferences = wallpaper.model?.preferences;
    void configureWallpaper({
      enabled,
      ...(enabled && preferences && !preferences.layers.background && !preferences.layers.lyrics
        ? { layers: { background: true } }
        : {}),
    });
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

  const toggleLayout = async () => {
    const nextLayout = isExpanded ? "compact" : "expanded";
    setIsLayoutPending(true);
    try {
      if (await wallpaper.setLayout(nextLayout)) {
        setLayout(nextLayout);
      } else {
        toast.error(t("desktopPlaybackController.layoutUpdateFailed"));
      }
    } catch {
      toast.error(t("desktopPlaybackController.layoutUpdateFailed"));
    } finally {
      setIsLayoutPending(false);
    }
  };

  const openMainSettings = async () => {
    try {
      if (!(await requestDesktopPlaybackControllerThemeEditor(runtime))) {
        toast.error(t("desktopPlaybackController.settingsOpenFailed"));
      }
    } catch {
      toast.error(t("desktopPlaybackController.settingsOpenFailed"));
    }
  };

  return (
    <main className="desktop-playback-controller-shell size-full bg-transparent p-1 select-none">
      <section className="desktop-playback-controller-surface relative flex size-full flex-col overflow-hidden rounded-[20px] border">
        <ControllerAtmosphere />
        <DesktopPlaybackControllerShortcutHandler
          onClose={() => void wallpaper.closeController()}
        />
        <DesktopPlaybackControllerHeader
          isLayoutPending={isLayoutPending}
          layout={layout}
          onClose={() => void wallpaper.closeController()}
          onLayoutChange={() => void toggleLayout()}
        />

        <div
          className={cn(
            "relative z-10 flex shrink-0 items-center px-4",
            isExpanded ? "h-42 pt-3" : "min-h-0 flex-1",
          )}
        >
          <DesktopPlaybackPlayerControls
            activeLyric={activeLyric}
            currentSong={null}
            desktopControl={
              <DesktopPlaybackControllerQuickToggle
                isPending={wallpaper.isPending}
                model={wallpaper.model}
                onEnabledChange={setWallpaperEnabled}
              />
            }
            durationMs={projection.durationMs}
            isPlaying={projection.isPlaying}
            onNext={() => void playbackCommands.next()}
            onPrevious={() => void playbackCommands.previous()}
            onSeek={(positionMs) => void playbackCommands.seek(positionMs)}
            onTogglePlaying={() => void playbackCommands.toggle()}
            onVolumeChange={(volume) => void playbackCommands.setVolume(volume)}
            positionMs={foliaPlayback.positionMs}
            track={track}
            volume={projection.volume}
          />
        </div>

        {isExpanded ? (
          <section className="desktop-controller-panel relative z-10 flex min-h-0 flex-1 flex-col border-t">
            <nav
              className="desktop-controller-segment mx-4 mt-3 grid h-10 shrink-0 grid-cols-2 gap-1 rounded-xl p-1"
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

            <div className="animate-in fade-in min-h-0 flex-1 duration-150">
              {activeTab === "appearance" ? (
                <DesktopPlaybackAppearanceControls
                  onOpenMainSettings={() => void openMainSettings()}
                />
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
          </section>
        ) : null}
      </section>
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
  icon: ReactNode;
  label: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className="desktop-controller-segment-button flex items-center justify-center gap-2 rounded-lg text-xs font-semibold transition"
      data-active={active}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function ControllerAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-surface absolute inset-0" />
      <div
        className="desktop-controller-blob -top-16 -left-14 size-52"
        style={{ backgroundColor: "var(--desktop-controller-accent)", opacity: 0.16 }}
      />
      <div
        className="desktop-controller-blob -right-16 -bottom-20 size-60"
        style={{ backgroundColor: "var(--desktop-controller-secondary)", opacity: 0.12 }}
      />
      <div
        className="desktop-controller-blob top-1/4 right-1/4 size-40"
        style={{ backgroundColor: "var(--desktop-controller-primary)", opacity: 0.05 }}
      />
    </div>
  );
}

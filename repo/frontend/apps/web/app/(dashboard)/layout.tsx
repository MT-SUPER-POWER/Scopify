"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { DashboardSkeleton } from "./_components/DashboardSkeleton";
import { LoadingNowPlayingSkeleton, SIDEBAR_BOOT_WIDTH } from "./_components/LoadingChrome";
import { WallpaperSurface, useWallpaperPreload } from "./_components/WallpaperSurface";
import Header from "@/components/Header";
import { PlayerBar } from "@/components/PlayBar";
import { Sidebar } from "@/components/Siderbar";
import { CommandWorkspaceModal } from "@/components/commandWorkspace/CommandWorkspaceModal";
import { CenterLyricsView } from "@/components/lyrics/CenterLyricsView";
import { FoliaSettingsMount } from "@/components/lyrics/FoliaSettingsMount";
import { LyricStageMount } from "@/components/lyrics/LyricStageMount";
import { NowPlayingCollapsedRail } from "@/components/nowPlaying/NowPlayingCollapsedRail";
import { NowPlayingPanel } from "@/components/nowPlaying/NowPlayingPanel";
import { NotificationRuntime } from "@/components/notifications/NotificationRuntime";
import { PlaybackMediaRuntimeProvider } from "@/components/player/PlaybackMediaRuntimeProvider";
import { PlayerCommandHandler } from "@/components/player/PlayerCommandHandler";
import { KeyboardShortcutHelp } from "@/components/shortcuts/KeyboardShortcutHelp";
import { getDashboardLoadingPlaceholder } from "@/components/shared/DashboardRouteSkeleton";
import { NavigationScrollProvider } from "@/components/shared/NavigationScrollProvider";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { WhatsNewModal } from "@/components/updates/WhatsNewModal";
import {
  DASHBOARD_LAYOUT_GROUP_ID,
  DASHBOARD_PANEL_IDS,
  NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT,
  NOW_PLAYING_PANEL_MAX_WIDTH,
  NOW_PLAYING_PANEL_MIN_WIDTH,
  NOW_PLAYING_PANEL_RAIL_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_DEFAULT_SIZE_PERCENT,
} from "@/constants/layout";
import { useStoreHydration } from "@/hooks/core/useStoreHydration";
import { useDesktopPlaybackWallpaperPresentation } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperPresentation";
import { useAnimatedPanelCollapse } from "@/hooks/ui/useAnimatedPanelCollapse";
import { useDashboardEffects } from "@/hooks/ui/useDashboardEffects";
import { useNowPlayingPanelVisibility } from "@/hooks/ui/useNowPlayingPanelVisibility";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/module/ui";

const RESIZE_HANDLE_CLASS = cn(
  "relative flex w-2 items-center justify-center bg-transparent transition-colors",
  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
  "after:absolute after:inset-y-0 after:w-px after:bg-transparent after:transition-colors",
  "hover:after:bg-border",
  "data-[resize-handle-state=drag]:after:bg-content-muted/50",
);

/**
 * 主界面外壳：顶栏、侧栏、内容区、正在播放栏、播放栏。
 * store 从 localStorage 异步水合期间只显示静默骨架，避免闪出未登录的界面。
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const isHydrated = useStoreHydration();
  const RoutePlaceholder = getDashboardLoadingPlaceholder(usePathname());

  return (
    <NavigationScrollProvider>
      {isHydrated ? (
        <DashboardShell>{children}</DashboardShell>
      ) : (
        <DashboardSkeleton content={RoutePlaceholder ? <RoutePlaceholder /> : undefined} />
      )}
    </NavigationScrollProvider>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  useDashboardEffects();

  const sidebarPanelRef = usePanelRef();
  const sidebarPanelElementRef = useRef<HTMLDivElement>(null);
  const nowPlayingPanelRef = usePanelRef();
  const nowPlayingPanelElementRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCollapsed = useUiStore((s) => s.isCollapsed);
  const setIsCollapsed = useUiStore((s) => s.setIsCollapsed);
  const isPlayerBarHidden = useUiStore((s) => s.isPlayerBarHidden);
  const isSearchOpen = useUiStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useUiStore((s) => s.setIsSearchOpen);
  const setIsNowPlayingPanelOpen = useUiStore((s) => s.setIsNowPlayingPanelOpen);

  const nowPlayingPanel = useNowPlayingPanelVisibility();
  const panelIds = nowPlayingPanel.canShow
    ? [DASHBOARD_PANEL_IDS.sidebar, DASHBOARD_PANEL_IDS.main, DASHBOARD_PANEL_IDS.nowPlaying]
    : [DASHBOARD_PANEL_IDS.sidebar, DASHBOARD_PANEL_IDS.main];
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: DASHBOARD_LAYOUT_GROUP_ID,
    panelIds,
    storage:
      typeof window !== "undefined"
        ? window.localStorage
        : {
            getItem: () => null,
            setItem: (_key: string, _value: string) => undefined,
          },
  });

  // 侧栏与右栏折叠成窄条而非卸载，开关时一起滑动
  useAnimatedPanelCollapse({
    panelRef: sidebarPanelRef,
    elementRef: sidebarPanelElementRef,
    collapsed: isCollapsed,
    enabled: isMounted,
  });
  useAnimatedPanelCollapse({
    panelRef: nowPlayingPanelRef,
    elementRef: nowPlayingPanelElementRef,
    collapsed: !nowPlayingPanel.isOpen,
    enabled: isMounted && nowPlayingPanel.canShow,
  });

  const wallpaper = useDesktopPlaybackWallpaperPresentation();
  useWallpaperPreload(wallpaper.model?.preferences.enabled ?? false);
  if (wallpaper.active && wallpaper.model) return <WallpaperSurface model={wallpaper.model} />;

  const main = (
    <>
      <PlayerCommandHandler />
      <NotificationRuntime />
      {children}
    </>
  );

  return (
    <PlaybackMediaRuntimeProvider>
      <div className="flex h-screen flex-1 flex-col gap-2 overflow-hidden bg-surface p-2 font-sans text-content">
        <CommandWorkspaceModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <KeyboardShortcutHelp />
        <WhatsNewModal />
        <LyricStageMount />
        <FoliaSettingsMount />

        {/* 顶栏行连同外边距一起作为桌面端窗口拖拽区（系统标题栏已隐藏） */}
        <div
          data-track-drag-chrome
          className="relative z-30 -mx-2 -mt-2 px-2 pt-2 [-webkit-app-region:drag]"
        >
          <Header />
        </div>

        <main className="relative min-h-0 w-full flex-1">
          {isMounted ? (
            <ResizablePanelGroup
              orientation="horizontal"
              defaultLayout={defaultLayout}
              onLayoutChanged={onLayoutChanged}
              className="size-full"
            >
              <ResizablePanel
                id={DASHBOARD_PANEL_IDS.sidebar}
                panelRef={sidebarPanelRef}
                elementRef={sidebarPanelElementRef}
                defaultSize={`${SIDEBAR_DEFAULT_SIZE_PERCENT}%`}
                minSize="15%"
                maxSize="40%"
                collapsible
                collapsedSize={SIDEBAR_COLLAPSED_WIDTH}
                onResize={() => setIsCollapsed(sidebarPanelRef.current?.isCollapsed() ?? false)}
                className="overflow-hidden rounded-lg bg-surface-sunken"
              >
                <Sidebar />
              </ResizablePanel>

              <ResizableHandle className={RESIZE_HANDLE_CLASS} />

              <ResizablePanel id={DASHBOARD_PANEL_IDS.main}>
                <DashboardMain className="size-full">{main}</DashboardMain>
              </ResizablePanel>

              {nowPlayingPanel.canShow && (
                <>
                  <ResizableHandle className={RESIZE_HANDLE_CLASS} />
                  <ResizablePanel
                    id={DASHBOARD_PANEL_IDS.nowPlaying}
                    panelRef={nowPlayingPanelRef}
                    elementRef={nowPlayingPanelElementRef}
                    defaultSize={`${NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT}%`}
                    minSize={NOW_PLAYING_PANEL_MIN_WIDTH}
                    maxSize={NOW_PLAYING_PANEL_MAX_WIDTH}
                    collapsible
                    collapsedSize={NOW_PLAYING_PANEL_RAIL_WIDTH}
                    onResize={() =>
                      setIsNowPlayingPanelOpen(
                        !(nowPlayingPanelRef.current?.isCollapsed() ?? false),
                      )
                    }
                    className="overflow-hidden"
                  >
                    {nowPlayingPanel.isOpen ? <NowPlayingPanel /> : <NowPlayingCollapsedRail />}
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          ) : (
            // 首帧还没有保存的面板布局，先按启动脚本写入的宽度排成静态三栏
            <div className="flex size-full gap-2">
              <div
                className={cn(
                  SIDEBAR_BOOT_WIDTH,
                  "shrink-0 overflow-hidden rounded-lg bg-surface-sunken",
                )}
              >
                <Sidebar />
              </div>
              <DashboardMain className="flex-1">{main}</DashboardMain>
              <LoadingNowPlayingSkeleton />
            </div>
          )}
        </main>

        <footer data-track-drag-chrome hidden={isPlayerBarHidden}>
          <PlayerBar />
        </footer>
      </div>
    </PlaybackMediaRuntimeProvider>
  );
}

/** 内容区：打开中心歌词时路由内容只隐藏不卸载，歌词盖在上面。 */
function DashboardMain({ className, children }: { className: string; children: ReactNode }) {
  const isCenterLyricsOpen = useUiStore((s) => s.isCenterLyricsOpen);
  const setIsCenterLyricsOpen = useUiStore((s) => s.setIsCenterLyricsOpen);
  const setIsNowPlayingPanelOpen = useUiStore((s) => s.setIsNowPlayingPanelOpen);

  return (
    <div
      data-dashboard-main
      className={cn("group/main relative overflow-hidden rounded-lg bg-surface-raised", className)}
    >
      <div className={cn("size-full overflow-hidden", isCenterLyricsOpen && "hidden")}>
        {children}
      </div>
      {isCenterLyricsOpen && (
        <CenterLyricsView
          onClose={() => {
            setIsCenterLyricsOpen(false);
            setIsNowPlayingPanelOpen(true);
          }}
        />
      )}
    </div>
  );
}

"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useStoreHydration } from "@/lib/hooks/useStoreHydration";
import { KeyboardShortcutHelp } from "@/components/shortcuts/KeyboardShortcutHelp";
import { getDashboardLoadingPlaceholder } from "@/components/shared/DashboardRouteSkeleton";
import { PlaybackMediaRuntimeProvider } from "@/components/player/PlaybackMediaRuntimeProvider";
import { useDesktopPlaybackWallpaperPresentation } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperPresentation";
import { useNowPlayingDocumentTitle } from "@/hooks/player/useNowPlayingDocumentTitle";
import { useSidebarLoadingLayout } from "@/hooks/sidebar/useSidebarLoadingLayout";
import { useAnimatedPanelCollapse } from "@/hooks/ui/useAnimatedPanelCollapse";
import { useNowPlayingPanelVisibility } from "@/hooks/ui/useNowPlayingPanelVisibility";
import {
  DASHBOARD_LAYOUT_GROUP_ID,
  DASHBOARD_PANEL_IDS,
  NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT,
  NOW_PLAYING_PANEL_MAX_WIDTH,
  NOW_PLAYING_PANEL_MIN_WIDTH,
  NOW_PLAYING_PANEL_RAIL_WIDTH,
  SIDEBAR_DEFAULT_SIZE_PERCENT,
} from "@/constants/layout";
import { runtime } from "@/lib/runtime";
import {
  DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH,
  DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH,
} from "@/constants/desktopPlaybackController";
// lib
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/module/search";
// status store
import { useUiStore } from "@/store/module/ui";
import Header from "@/components/Header";
import { FoliaSettingsMount } from "@/components/lyrics/FoliaSettingsMount";
import { LyricStageMount } from "@/components/lyrics/LyricStageMount";
import { PlayerBar } from "@/components/PlayBar";
import { CommandWorkspaceModal } from "@/components/commandWorkspace/CommandWorkspaceModal";
import { WhatsNewModal } from "@/components/updates/WhatsNewModal";
// self components
import MainLayoutSkeleton from "./Skeleton";
import { LoadingNowPlayingSkeleton } from "./LoadingChrome";
import { Sidebar } from "@/components/Siderbar";
import { NowPlayingCollapsedRail } from "@/components/nowPlaying/NowPlayingCollapsedRail";
import { NowPlayingPanel } from "@/components/nowPlaying/NowPlayingPanel";

// The wallpaper renderer brings the entire Folia visualizer graph into the
// bundle. It is only used by the dedicated desktop-wallpaper window, so keep
// it out of every dashboard route until that window actually activates it.
const DesktopPlaybackWallpaperRenderer = dynamic(
  () =>
    import("@/components/desktopWallpaper/DesktopPlaybackWallpaperRenderer").then((module) => ({
      default: module.DesktopPlaybackWallpaperRenderer,
    })),
  { ssr: false },
);

const RESIZE_HANDLE_CLASS = cn(
  "relative flex w-2 items-center justify-center bg-transparent transition-colors",
  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
  "after:absolute after:inset-y-0 after:w-px after:bg-transparent after:transition-colors",
  "hover:after:bg-border",
  "data-[resize-handle-state=drag]:after:bg-content-muted/50",
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKELETON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MainLayoutInner({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // DOM 引用与界面状态标记
  const sidebarPanelRef = usePanelRef();
  const sidebarPanelElementRef = useRef<HTMLDivElement>(null);
  const nowPlayingPanelRef = usePanelRef();
  const nowPlayingPanelElementRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const sidebarLoadingLayout = useSidebarLoadingLayout();
  useNowPlayingDocumentTitle();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Zustand Stores
  const clearSearchQuery = useSearchStore((s) => s.clearQuery);
  const isCollapsed = useUiStore((s) => s.isCollapsed);
  const setIsCollapsed = useUiStore((s) => s.setIsCollapsed);
  const setIsNowPlayingPanelOpen = useUiStore((s) => s.setIsNowPlayingPanelOpen);
  const setIsFullscreen = useUiStore((s) => s.setIsFullscreen);

  // 监听路由变化，如果回到首页则清空搜索词
  useEffect(() => {
    if (pathname === "/") {
      clearSearchQuery();
    }
  }, [pathname, clearSearchQuery]);

  // 监听来自 Electron 主进程的导航请求
  useEffect(() => {
    return runtime.navigation.onNavigate((path) => {
      if (
        path === DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH ||
        path === DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH
      )
        return;
      router.push(path, { scroll: false });
    });
  }, [router]);

  useEffect(() => {
    return runtime.desktopLyrics.onCommand((command) => {
      window.dispatchEvent(new CustomEvent("desktop-lyric:stage-command", { detail: command }));
    });
  }, []);

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

  const isSearchOpen = useUiStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useUiStore((s) => s.setIsSearchOpen);
  const wallpaperPresentation = useDesktopPlaybackWallpaperPresentation();

  useEffect(() => {
    return runtime.window.onFullscreenChanged(setIsFullscreen);
  }, [setIsFullscreen]);

  useAnimatedPanelCollapse({
    panelRef: sidebarPanelRef,
    elementRef: sidebarPanelElementRef,
    collapsed: isCollapsed,
    enabled: isMounted,
  });

  // 右栏折叠为窄条而非卸载，开关时与侧边栏同样滑动
  useAnimatedPanelCollapse({
    panelRef: nowPlayingPanelRef,
    elementRef: nowPlayingPanelElementRef,
    collapsed: !nowPlayingPanel.isOpen,
    enabled: isMounted && nowPlayingPanel.canShow,
  });

  if (wallpaperPresentation.active && wallpaperPresentation.model) {
    return (
      <PlaybackMediaRuntimeProvider>
        <main
          data-desktop-playback-wallpaper-root
          className="relative h-screen w-screen overflow-hidden bg-transparent"
        >
          <DesktopPlaybackWallpaperRenderer model={wallpaperPresentation.model} />
        </main>
      </PlaybackMediaRuntimeProvider>
    );
  }

  const content = (
    <div
      className={cn(
        "flex-1 flex-col bg-surface font-sans text-content",
        "gap-2 overflow-hidden p-2",
        "flex h-screen",
      )}
    >
      {/* 全局工具注册 */}
      <CommandWorkspaceModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <KeyboardShortcutHelp />
      <WhatsNewModal />
      <LyricStageMount />
      <FoliaSettingsMount />

      <div data-track-drag-chrome className="relative z-30">
        <Header />
      </div>

      {/* 三栏结构 */}
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
              collapsedSize={80}
              onResize={() => setIsCollapsed(sidebarPanelRef.current?.isCollapsed() ?? false)}
              className={cn("overflow-hidden rounded-lg bg-surface-sunken")}
            >
              <Sidebar />
            </ResizablePanel>

            <ResizableHandle className={RESIZE_HANDLE_CLASS} />

            <ResizablePanel id={DASHBOARD_PANEL_IDS.main}>
              <div
                data-dashboard-main
                className="group/main relative size-full overflow-hidden rounded-lg bg-surface-raised"
              >
                <div className="size-full overflow-hidden">{children}</div>
              </div>
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
                    setIsNowPlayingPanelOpen(!(nowPlayingPanelRef.current?.isCollapsed() ?? false))
                  }
                  className="overflow-hidden"
                >
                  {nowPlayingPanel.isOpen ? <NowPlayingPanel /> : <NowPlayingCollapsedRail />}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        ) : (
          <div className="flex size-full gap-2">
            <div
              className="shrink-0 overflow-hidden rounded-lg bg-surface-sunken"
              style={{ width: `${sidebarLoadingLayout.sizePercent}%` }}
            >
              <Sidebar />
            </div>
            <div
              data-dashboard-main
              className="group/main relative flex-1 overflow-hidden rounded-lg bg-surface-raised"
            >
              <div className="size-full overflow-hidden">{children}</div>
            </div>
            <LoadingNowPlayingSkeleton />
          </div>
        )}
      </main>

      <footer data-track-drag-chrome>
        <PlayerBar />
      </footer>
    </div>
  );
  return <PlaybackMediaRuntimeProvider>{content}</PlaybackMediaRuntimeProvider>;
}

/**
 * MainLayout: 播放器的子组件 - 支持懒加载 + 骨架屏
 */
export function MainLayout({ children }: { children?: ReactNode }) {
  const isHydrated = useStoreHydration();
  const pathname = usePathname();
  const HydrationPlaceholder = getDashboardLoadingPlaceholder(pathname);

  // Store 正在从 localStorage 进行异步水合时，显示静默骨架屏，避免闪烁未登录 UI
  if (!isHydrated) {
    return (
      <MainLayoutSkeleton content={HydrationPlaceholder ? <HydrationPlaceholder /> : undefined} />
    );
  }

  return <MainLayoutInner>{children}</MainLayoutInner>;
}

export default MainLayout;

"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useStoreHydration } from "@/lib/hooks/useStoreHydration";
import { KeyboardShortcutHelp } from "@/components/shortcuts/KeyboardShortcutHelp";
import { DesktopPlaybackWallpaperRenderer } from "@/components/desktopWallpaper/DesktopPlaybackWallpaperRenderer";
import { getDashboardLoadingPlaceholder } from "@/components/shared/DashboardRouteSkeleton";
import { PlaybackMediaRuntimeProvider } from "@/components/player/PlaybackMediaRuntimeProvider";
import { useDesktopPlaybackWallpaperPresentation } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperPresentation";
import { runtime } from "@/lib/runtime";
import { DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH } from "@/constants/desktopPlaybackController";
// lib
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/module/search";
// status store
import { useUiStore } from "@/store/module/ui";
import Header from "../components/Header";
import { LyricStageMount } from "../components/lyrics/LyricStageMount";
import { PlayerBar } from "../components/PlayerBar";
import { CommandWorkspaceModal } from "@/components/commandWorkspace/CommandWorkspaceModal";
// self components
import MainLayoutSkeleton from "./MainLayout/Skeleton";
import { Sidebar } from "./Sidebar";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKELETON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MainLayoutInner({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // DOM 引用与界面状态标记
  const sidebarPanelRef = usePanelRef();
  const sidebarPanelElementRef = useRef<HTMLDivElement>(null);
  const hasInitializedSidebarPanelRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Zustand Stores
  const clearSearchQuery = useSearchStore((s) => s.clearQuery);
  const isCollapsed = useUiStore((s) => s.isCollapsed);
  const setIsCollapsed = useUiStore((s) => s.setIsCollapsed);
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
      if (path === DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH) return;
      router.push(path, { scroll: false });
    });
  }, [router]);

  useEffect(() => {
    return runtime.desktopLyrics.onCommand((command) => {
      window.dispatchEvent(new CustomEvent("desktop-lyric:stage-command", { detail: command }));
    });
  }, []);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    groupId: "music-player-layout",
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

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;

    if (!hasInitializedSidebarPanelRef.current) {
      hasInitializedSidebarPanelRef.current = true;
      if (isCollapsed) panel.collapse();
      else panel.expand();
      return;
    }

    const panelElement = sidebarPanelElementRef.current;
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let clearTransitionTimeout: number | undefined;
    if (!shouldReduceMotion && panelElement) {
      panelElement.style.transition = "flex-grow 220ms cubic-bezier(0.22, 1, 0.36, 1)";
      panelElement.style.willChange = "flex-grow";
      clearTransitionTimeout = window.setTimeout(() => {
        panelElement.style.transition = "";
        panelElement.style.willChange = "";
      }, 220);
    }

    if (isCollapsed) panel.collapse();
    else panel.expand();

    return () => {
      if (clearTransitionTimeout !== undefined) {
        window.clearTimeout(clearTransitionTimeout);
      }
      if (!panelElement) return;
      panelElement.style.transition = "";
      panelElement.style.willChange = "";
    };
  }, [isCollapsed, isMounted, sidebarPanelRef]);

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
      <LyricStageMount />

      {/* 左右结构 */}
      <main className="relative min-h-0 w-full flex-1">
        {isMounted ? (
          <ResizablePanelGroup
            orientation="horizontal"
            defaultLayout={defaultLayout}
            onLayoutChanged={onLayoutChanged}
            className="size-full"
          >
            <ResizablePanel
              panelRef={sidebarPanelRef}
              elementRef={sidebarPanelElementRef}
              defaultSize="20%"
              minSize="15%"
              maxSize="40%"
              collapsible
              collapsedSize={80}
              onResize={() => setIsCollapsed(sidebarPanelRef.current?.isCollapsed() ?? false)}
              className={cn("overflow-hidden rounded-lg bg-surface-sunken")}
            >
              <Sidebar />
            </ResizablePanel>

            <ResizableHandle
              className={cn(
                "relative flex w-2 items-center justify-center bg-transparent transition-colors",
                "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                "after:absolute after:inset-y-0 after:w-px after:bg-transparent after:transition-colors",
                "hover:after:bg-border",
                "data-[resize-handle-state=drag]:after:bg-content-muted/50",
              )}
            />

            <ResizablePanel>
              <div className="group/main relative size-full overflow-hidden rounded-lg bg-surface-raised">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
                  <div className="pointer-events-auto">
                    <Header />
                  </div>
                </div>

                <div className="size-full overflow-hidden">{children}</div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex size-full gap-2">
            <div className="w-[20%] overflow-hidden rounded-lg bg-surface-sunken">
              <Sidebar />
            </div>
            <div className="group/main relative flex-1 overflow-hidden rounded-lg bg-surface-raised">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
                <div className="pointer-events-auto">
                  <Header />
                </div>
              </div>
              <div className="size-full overflow-hidden">{children}</div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <PlayerBar />
      </footer>
    </div>
  );
  return <PlaybackMediaRuntimeProvider>{content}</PlaybackMediaRuntimeProvider>;
}

/**
 * MainLayout: 播放器的子组件 - 支持懒加载 + 骨架屏
 */
export default function MainLayout({ children }: { children?: ReactNode }) {
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

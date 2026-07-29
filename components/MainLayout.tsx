"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useBackendStartup } from "@/lib/hooks/useBackendStartup";
import { useStoreHydration } from "@/lib/hooks/useStoreHydration";
import { useAudioVisualizer } from "@/hooks/player/useAudioVisualizer";
import { useDesktopLyricPublisher } from "@/hooks/player/useDesktopLyricPublisher";
import { toggleCurrentSongLike } from "@/lib/player/toggleCurrentSongLike";
import { CommandPalette } from "@/components/shortcuts/CommandPalette";
import { KeyboardShortcutHelp } from "@/components/shortcuts/KeyboardShortcutHelp";
import { getDashboardLoadingPlaceholder } from "@/components/shared/DashboardRouteSkeleton";
// lib
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import { useSearchStore } from "@/store/module/search";
import { useTimeStore } from "@/store/module/time";
// status store
import { useUiStore } from "@/store/module/ui";
import Header from "../components/Header";
import { LyricStageMount } from "../components/lyrics/LyricStageMount";
import { PlayerBar } from "../components/PlayerBar";
import { SearchModal } from "../components/SearchModal";
import AppCloseDialog from "./AppCloseDialog";
// self components
import MainLayoutSkeleton from "./MainLayout/Skeleton";
import { Sidebar } from "./Sidebar";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKELETON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MainLayoutInner({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // DOM 引用与节流/状态标记
  const audioRef = useRef<HTMLAudioElement>(null);
  const sidebarPanelRef = usePanelRef();
  const sidebarPanelElementRef = useRef<HTMLDivElement>(null);
  const hasInitializedSidebarPanelRef = useRef(false);
  const lastStoreWriteRef = useRef(0);
  const hasRestoredProgressRef = useRef(false); // 必须声明：标记是否已经恢复过进度
  const [isMounted, setIsMounted] = useState(false);

  useAudioVisualizer(audioRef);
  useDesktopLyricPublisher();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Zustand Stores
  const clearSearchQuery = useSearchStore((s) => s.clearQuery);
  const volume = usePlayerStore((s) => s.volume);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSongUrl = usePlayerStore((s) => s.currentSongUrl);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const playNext = usePlayerStore((s) => s.playNext);
  const isCollapsed = useUiStore((s) => s.isCollapsed);
  const setIsCollapsed = useUiStore((s) => s.setIsCollapsed);
  const setIsFullscreen = useUiStore((s) => s.setIsFullscreen);

  // 1. 负责加载音频 URL & 重置恢复标记
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSongUrl) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load();

      hasRestoredProgressRef.current = false;
      lastStoreWriteRef.current = 0;

      useTimeStore.getState().setCurrentTime(0);
      useTimeStore.getState().setBufferedTime(0);
      useTimeStore.getState().setTotalTime(0);
      window.dispatchEvent(new CustomEvent("player-time", { detail: 0 }));
      return;
    }

    if (audio.src !== currentSongUrl) {
      audio.src = currentSongUrl;
      hasRestoredProgressRef.current = false; // ⚠️ 核心：切歌时必须重置保险栓
      window.dispatchEvent(new CustomEvent("player-time", { detail: 0 }));
      audio.load();
    }
    void usePlayerStore.getState().fetchCurrentLyric();
  }, [currentSongUrl]);

  // 2. 负责触发播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("Play interrupted or not allowed:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongUrl, setIsPlaying]);

  // 3. 负责同步音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume]);

  // 4. 监听进度条的跳转 (Seek) 指令
  useEffect(() => {
    const onSeek = (e: Event) => {
      const newTimeMs = (e as CustomEvent<number>).detail;
      if (audioRef.current) {
        audioRef.current.currentTime = newTimeMs / 1000;
      }
      // 手动跳转时，立刻把时间存入 Store 以便持久化
      useTimeStore.getState().setCurrentTime(newTimeMs);
    };

    window.addEventListener("player-seek", onSeek);
    return () => window.removeEventListener("player-seek", onSeek);
  }, []);

  // 监听路由变化，如果回到首页则清空搜索词
  useEffect(() => {
    if (pathname === "/") {
      clearSearchQuery();
    }
  }, [pathname, clearSearchQuery]);

  // 监听来自 Electron 主进程的导航请求
  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI?.onNavigate) {
      window.electronAPI.onNavigate((path) => {
        router.push(path, { scroll: false });
      });
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onDesktopLyricCommand((command) => {
      switch (command.type) {
        case "next":
          void usePlayerStore.getState().playNext();
          break;
        case "previous":
          void usePlayerStore.getState().playPrev();
          break;
        case "seek":
          window.dispatchEvent(new CustomEvent("player-seek", { detail: command.positionMs }));
          break;
        case "toggle-like":
          void toggleCurrentSongLike().catch((error) => {
            console.warn("[desktop-lyric] failed to toggle like", error);
          });
          break;
        case "toggle-play":
          usePlayerStore.getState().togglePlaying();
          break;
        default:
          window.dispatchEvent(new CustomEvent("desktop-lyric:stage-command", { detail: command }));
      }
    });
    return unsubscribe;
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

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    window.electronAPI?.onFullScreenChanged(setIsFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.electronAPI?.off("window-full-screen-changed");
    };
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

  return (
    <div
      className={cn(
        "flex-1 flex-col bg-black font-sans text-white",
        "gap-2 overflow-hidden p-2",
        "flex h-screen",
      )}
    >
      {/* 模态注册 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CommandPalette />
      <KeyboardShortcutHelp />
      <AppCloseDialog />
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
              className={cn("overflow-hidden rounded-lg bg-[#0f0f0f]")}
            >
              <Sidebar />
            </ResizablePanel>

            <ResizableHandle
              className={cn(
                "relative flex w-2 items-center justify-center bg-transparent transition-colors",
                "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                "after:absolute after:inset-y-0 after:w-px after:bg-transparent after:transition-colors",
                "hover:after:bg-white/10",
                "data-[resize-handle-state=drag]:after:bg-white/30",
              )}
            />

            <ResizablePanel>
              <div className="group/main relative size-full overflow-hidden rounded-lg bg-[#121212]">
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
            <div className="w-[20%] overflow-hidden rounded-lg bg-[#0f0f0f]">
              <Sidebar />
            </div>
            <div className="group/main relative flex-1 overflow-hidden rounded-lg bg-[#121212]">
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
        {/* NOTE: 所有的原生音频事件绑定在这里 */}
        <audio
          preload="auto"
          crossOrigin="anonymous"
          className="hidden"
          ref={audioRef}
          // 下一曲了
          onEnded={() => void playNext("ended")}
          // 切歌存新的时间
          onDurationChange={(e) => {
            const duration = e.currentTarget.duration;
            if (Number.isFinite(duration) && duration > 0) {
              window.dispatchEvent(new CustomEvent("player-duration", { detail: duration * 1000 }));
              useTimeStore.getState().setTotalTime(duration * 1000);
            }
          }}
          // 加载进度缓存存储
          onProgress={(e) => {
            const audio = e.currentTarget;
            if (audio.buffered.length > 0) {
              // 获取最新缓冲段的结束时间
              const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
              // console.log("Buffered end:", "write time");
              useTimeStore.getState().setBufferedTime(bufferedEnd * 1000);
            }
          }}
          // 同步 UI 时间，并存储时间到 Zustand 永久化存储
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            if (audio.paused) return;

            const currentTimeMs = audio.currentTime * 1000;
            const now = Date.now();

            // A. 每秒多次：广播给进度条组件（完全脱离 React 渲染树）
            window.dispatchEvent(new CustomEvent("player-time", { detail: currentTimeMs }));

            // B. 每 3 秒一次：写入 Zustand 做持久化备份
            if (now - lastStoreWriteRef.current > 3000) {
              useTimeStore.getState().setCurrentTime(currentTimeMs);
              lastStoreWriteRef.current = now;
            }
          }}
          // 重新恢复歌曲到存储的位置
          onCanPlay={(e) => {
            const audio = e.currentTarget;

            // 如果这首歌还没恢复过进度，则进行跳转
            if (!hasRestoredProgressRef.current) {
              const persistedTime = useTimeStore.getState().currentTime;

              if (persistedTime > 0) {
                const restoreSeconds = persistedTime / 1000;
                if (Number.isFinite(audio.duration) && audio.duration > 0) {
                  audio.currentTime = Math.min(restoreSeconds, audio.duration - 1);
                } else {
                  audio.currentTime = restoreSeconds;
                }
                // 🔁 广播恢复后的进度给 ProgressBar（无需等用户点播放）
                window.dispatchEvent(new CustomEvent("player-time", { detail: persistedTime }));
              } else {
                // 如果 persistedTime 为 0，说明是切歌，强制 currentTime 归零并写入 store
                audio.currentTime = 0;
                useTimeStore.getState().setCurrentTime(0);
                window.dispatchEvent(new CustomEvent("player-time", { detail: 0 }));
              }
              // 恢复完毕，拉上保险栓，防止后续因为网络缓冲等原因重复触发
              hasRestoredProgressRef.current = true;
            }

            if (isPlaying) audio.play().catch(console.error);
          }}
        />

        <PlayerBar />
      </footer>
    </div>
  );
}

/**
 * MainLayout: 播放器的子组件 - 支持懒加载 + 骨架屏
 */
export default function MainLayout({ children }: { children?: ReactNode }) {
  const { t } = useI18n();
  const backendStartup = useBackendStartup();
  const isHydrated = useStoreHydration();
  const pathname = usePathname();
  const HydrationPlaceholder = getDashboardLoadingPlaceholder(pathname);

  if (backendStartup.state === "starting") {
    return (
      <MainLayoutSkeleton
        title={t("layout.startingTitle")}
        description={t("layout.startingDescription")}
      />
    );
  }

  if (backendStartup.state === "failed") {
    return (
      <MainLayoutSkeleton
        title={t("layout.failedTitle")}
        description={backendStartup.message ?? t("layout.failedDescription")}
        actionLabel={t("layout.restartApp")}
        onAction={() => window.electronAPI?.relaunchApp()}
      />
    );
  }

  // Store 正在从 localStorage 进行异步水合时，显示静默骨架屏，避免闪烁未登录 UI
  if (!isHydrated) {
    return (
      <MainLayoutSkeleton content={HydrationPlaceholder ? <HydrationPlaceholder /> : undefined} />
    );
  }

  return <MainLayoutInner>{children}</MainLayoutInner>;
}

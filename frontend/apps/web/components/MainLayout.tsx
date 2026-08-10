"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useBackendStartup } from "@/lib/hooks/useBackendStartup";
import { useStoreHydration } from "@/lib/hooks/useStoreHydration";
import { useAudioVisualizer } from "@/hooks/player/useAudioVisualizer";
import { useDesktopPlaybackWallpaperAudioPublisher } from "@/hooks/player/useDesktopPlaybackWallpaperAudioPublisher";
import { CommandPalette } from "@/components/shortcuts/CommandPalette";
import { KeyboardShortcutHelp } from "@/components/shortcuts/KeyboardShortcutHelp";
import { getDashboardLoadingPlaceholder } from "@/components/shared/DashboardRouteSkeleton";
import { AudioSettingsDialog } from "@/components/player/AudioSettingsDialog";
import { PlaybackAuthorityProvider } from "@/components/player/PlaybackAuthorityProvider";
import { isPlaybackSourceCurrent } from "@/lib/player/playbackSource";
import { runtime } from "@/lib/runtime";
import { DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH } from "@/constants/desktopPlaybackController";
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
  const isMediaSourceLoadingRef = useRef(false);
  const mediaSourceLoadRevisionRef = useRef(-1);
  const hasWarmedPlaybackUrlRef = useRef(false);
  const failedSourceRetrySessionKeyRef = useRef<string | null>(null);
  const refreshingFailedSourceSessionKeyRef = useRef<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useAudioVisualizer(audioRef);
  useDesktopPlaybackWallpaperAudioPublisher();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Zustand Stores
  const clearSearchQuery = useSearchStore((s) => s.clearQuery);
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const currentSongUrl = usePlayerStore((s) => s.currentSongUrl);
  const playbackLoadRevision = usePlayerStore((s) => s.playbackLoadRevision);
  const sourceChangeMode = usePlayerStore((s) => s.sourceChangeMode);
  const refreshCurrentTrackUrl = usePlayerStore((s) => s.refreshCurrentTrackUrl);
  const isCollapsed = useUiStore((s) => s.isCollapsed);
  const setIsCollapsed = useUiStore((s) => s.setIsCollapsed);
  const setIsFullscreen = useUiStore((s) => s.setIsFullscreen);

  // 1. 负责加载音频 URL & 重置恢复标记
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const capturePreservedPosition = () => {
      const hasSource = Boolean(audio.currentSrc || audio.getAttribute("src"));
      if (
        sourceChangeMode === "preserve-position" &&
        hasSource &&
        Number.isFinite(audio.currentTime)
      ) {
        useTimeStore.getState().setCurrentTime(Math.max(0, audio.currentTime * 1_000));
      }
    };

    if (!currentSongUrl) {
      capturePreservedPosition();
      isMediaSourceLoadingRef.current = currentSongDetail !== null;
      mediaSourceLoadRevisionRef.current = -1;
      audio.removeAttribute("src");
      audio.load();

      lastStoreWriteRef.current = 0;

      useTimeStore.getState().setBufferedTime(0);
      if (!currentSongDetail) {
        useTimeStore.getState().setCurrentTime(0);
        useTimeStore.getState().setTotalTime(0);
      }
      return;
    }

    if (audio.src !== currentSongUrl) {
      capturePreservedPosition();
      isMediaSourceLoadingRef.current = true;
      mediaSourceLoadRevisionRef.current = playbackLoadRevision;
      audio.src = currentSongUrl;
      audio.load();
    }
    void usePlayerStore.getState().fetchCurrentLyric();
  }, [currentSongDetail, currentSongUrl, playbackLoadRevision, sourceChangeMode]);

  // Restored songs deliberately do not persist their expiring CDN URL. Warm a
  // fresh source while the player remains paused so the next user click can
  // call play() against a loaded source within the browser's user gesture.
  useEffect(() => {
    if (hasWarmedPlaybackUrlRef.current) return;
    hasWarmedPlaybackUrlRef.current = true;
    if (!currentSongDetail || currentSongUrl) return;

    void refreshCurrentTrackUrl();
  }, [currentSongDetail, currentSongUrl, refreshCurrentTrackUrl]);

  useEffect(() => {
    failedSourceRetrySessionKeyRef.current = null;
  }, [currentSongDetail?.id]);

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

  const isActiveMediaSource = (audio: HTMLAudioElement) => {
    const player = usePlayerStore.getState();
    return Boolean(
      player.currentSongUrl &&
      mediaSourceLoadRevisionRef.current === player.playbackLoadRevision &&
      isPlaybackSourceCurrent(audio, player.currentSongUrl),
    );
  };

  const isPlaybackSessionCurrent = (sessionKey: string | null) => {
    if (!sessionKey) return false;
    const player = usePlayerStore.getState();
    const songId = player.currentSongDetail?.id;
    return songId !== undefined && `${player.playbackSessionRevision}:${songId}` === sessionKey;
  };

  return (
    <PlaybackAuthorityProvider
      audioRef={audioRef}
      isMediaSourceLoadingRef={isMediaSourceLoadingRef}
      mediaSourceLoadRevisionRef={mediaSourceLoadRevisionRef}
    >
      <div
        className={cn(
          "bg-surface text-content flex-1 flex-col font-sans",
          "gap-2 overflow-hidden p-2",
          "flex h-screen",
        )}
      >
        {/* 模态注册 */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <AudioSettingsDialog />
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
                className={cn("bg-surface-sunken overflow-hidden rounded-lg")}
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
                <div className="bg-surface-raised group/main relative size-full overflow-hidden rounded-lg">
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
              <div className="bg-surface-sunken w-[20%] overflow-hidden rounded-lg">
                <Sidebar />
              </div>
              <div className="bg-surface-raised group/main relative flex-1 overflow-hidden rounded-lg">
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
            onError={(event) => {
              const audio = event.currentTarget;
              const player = usePlayerStore.getState();
              const songId = player.currentSongDetail?.id ?? null;
              const failureSessionKey =
                songId !== null ? `${player.playbackSessionRevision}:${songId}` : null;
              let sourceHost: string | null = null;
              try {
                sourceHost = new URL(audio.currentSrc || audio.src).host || null;
              } catch {
                // Keep expiring URLs and their query parameters out of logs.
              }

              if (!isActiveMediaSource(audio)) {
                console.warn("[player] Ignored an error from an obsolete media source", {
                  songId,
                  sourceHost,
                });
                return;
              }

              console.error("[player] Media playback failed", {
                errorCode: audio.error?.code ?? null,
                errorMessage: audio.error?.message ?? null,
                networkState: audio.networkState,
                readyState: audio.readyState,
                songId,
                sourceHost,
              });

              if (!songId) {
                isMediaSourceLoadingRef.current = false;
                return;
              }
              if (refreshingFailedSourceSessionKeyRef.current === failureSessionKey) return;
              if (failedSourceRetrySessionKeyRef.current === failureSessionKey) {
                const failureIdentity = {
                  revision: player.playbackLoadRevision,
                  trackId: songId,
                };
                isMediaSourceLoadingRef.current = true;
                void player.handlePlaybackFailure("audio", failureIdentity).finally(() => {
                  if (isPlaybackSessionCurrent(failureSessionKey)) {
                    isMediaSourceLoadingRef.current = false;
                  }
                });
                return;
              }

              failedSourceRetrySessionKeyRef.current = failureSessionKey;
              isMediaSourceLoadingRef.current = true;
              refreshingFailedSourceSessionKeyRef.current = failureSessionKey;
              void player
                .refreshCurrentTrackUrl()
                .then(async (result) => {
                  if (result.status !== "failed") return;
                  await usePlayerStore.getState().handlePlaybackFailure("audio", result.identity);
                  if (isPlaybackSessionCurrent(failureSessionKey)) {
                    isMediaSourceLoadingRef.current = false;
                  }
                })
                .catch((error) => {
                  console.error("[player] Failed to refresh the playback source", error);
                  if (isPlaybackSessionCurrent(failureSessionKey)) {
                    isMediaSourceLoadingRef.current = false;
                  }
                })
                .finally(() => {
                  if (refreshingFailedSourceSessionKeyRef.current === failureSessionKey) {
                    refreshingFailedSourceSessionKeyRef.current = null;
                  }
                });
            }}
            onPlaying={(event) => {
              if (!isActiveMediaSource(event.currentTarget)) return;
              isMediaSourceLoadingRef.current = false;
              failedSourceRetrySessionKeyRef.current = null;
            }}
            // 切歌存新的时间
            onDurationChange={(e) => {
              if (!isActiveMediaSource(e.currentTarget)) return;
              const duration = e.currentTarget.duration;
              if (Number.isFinite(duration) && duration > 0) {
                useTimeStore.getState().setTotalTime(duration * 1000);
              }
            }}
            onPause={(event) => {
              if (!isActiveMediaSource(event.currentTarget)) return;
              if (isMediaSourceLoadingRef.current) return;
              const positionMs = event.currentTarget.currentTime * 1_000;
              if (Number.isFinite(positionMs)) {
                useTimeStore.getState().setCurrentTime(Math.max(0, positionMs));
              }
            }}
            // 加载进度缓存存储
            onProgress={(e) => {
              const audio = e.currentTarget;
              if (!isActiveMediaSource(audio)) return;
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
              if (!isActiveMediaSource(audio)) return;
              if (audio.paused) return;

              const currentTimeMs = audio.currentTime * 1000;
              const now = Date.now();

              // 每 3 秒写入一次恢复检查点；实时 UI 位置由 Playback Replica 投影。
              if (now - lastStoreWriteRef.current > 3000) {
                useTimeStore.getState().setCurrentTime(currentTimeMs);
                lastStoreWriteRef.current = now;
              }
            }}
            onCanPlay={(event) => {
              if (!isActiveMediaSource(event.currentTarget)) return;
              isMediaSourceLoadingRef.current = false;
            }}
          />

          <PlayerBar />
        </footer>
      </div>
    </PlaybackAuthorityProvider>
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
        onAction={() => runtime.app.relaunch()}
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

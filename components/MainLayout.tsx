'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { ReactNode, use, useEffect, useRef } from "react";

import Header from "../components/Header";
import { PlayerBar } from "../components/PlayerBar";
import { SearchModal } from "../components/SearchModal";

// status store
import { useUiStore } from "@/store/module/ui";

// lib
import { cn } from "@/lib/utils";
import { useDefaultLayout } from "react-resizable-panels";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable";

// self components
import MainLayoutSkeleton from "./MainLayout/Skeleton";
import LyricsModal from "../components/LyricModal";

import { useHasHydrated } from "@/lib/hooks/useHydration";
import AppCloseDialog from "./AppCloseDialog";
import { useRouter, usePathname } from "next/navigation";
import { useSearchStore } from "@/store/module/search";
import { useTimeStore } from "@/store/module/time";
import { usePlayerStore } from "@/store/module/player";
import { Sidebar } from "./Sidebar";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKELETON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


function MainLayoutInner({
  children,
}: {
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // DOM 引用与节流/状态标记
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastStoreWriteRef = useRef(0);
  const hasRestoredProgressRef = useRef(false); // 必须声明：标记是否已经恢复过进度

  // Zustand Stores
  const clearSearchQuery = useSearchStore((s) => s.clearQuery);
  const volume = usePlayerStore(s => s.volume);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const currentSongUrl = usePlayerStore(s => s.currentSongUrl);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const playNext = usePlayerStore(s => s.playNext);

  // 1. 负责加载音频 URL & 重置恢复标记
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;

    if (audio.src !== currentSongUrl) {
      audio.src = currentSongUrl;
      hasRestoredProgressRef.current = false; // ⚠️ 核心：切歌时必须重置保险栓
      audio.load();
    }
    usePlayerStore.getState().fetchCurrentLyric();
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
        router.push(path);
      });
    }
  }, [router]);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    groupId: "music-player-layout",
  });


  const isSearchOpen = useUiStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useUiStore((s) => s.setIsSearchOpen);
  const scrollContainer = useUiStore((s) => s.scrollContainer);
  const setScrollContainer = useUiStore((s) => s.setScrollContainer);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === "Escape" && isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  return (
    <div className={cn(
      "flex-1 flex-col bg-black text-white font-sans",
      "overflow-hidden p-2 gap-2",
      "flex h-screen"
    )}>

      {/* 模态注册 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AppCloseDialog />
      <LyricsModal />

      {/* 左右结构 */}
      <main className="flex-1 min-h-0 relative w-full">
        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
          className="w-full h-full"
        >
          <ResizablePanel
            defaultSize="20%"
            minSize="15%"
            maxSize="40%"
            collapsible
            collapsedSize={80}
            className={cn("bg-[#0f0f0f] rounded-lg overflow-hidden",)}
          >
            <Sidebar />
          </ResizablePanel>

          <ResizableHandle
            className={cn(
              "w-2 bg-transparent relative flex items-center justify-center transition-colors",
              "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "after:absolute after:inset-y-0 after:w-px after:bg-transparent after:transition-colors",
              "hover:after:bg-white/10",
              "data-[resize-handle-state=drag]:after:bg-white/30"
            )}
          />

          <ResizablePanel>
            <div className="h-full w-full bg-[#121212] rounded-lg relative overflow-hidden group/main">
              <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                <div className="pointer-events-auto">
                  <Header onOpenSearch={() => setIsSearchOpen(true)} scrollContainer={scrollContainer} />
                </div>
              </div>

              {/* DEBUG: 滚动区元素全局绑定共享 */}
              <ScrollArea className="h-full w-full" viewportRef={setScrollContainer}>
                {children}
              </ScrollArea>

            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <footer>
        {/* NOTE: 所有的原生音频事件绑定在这里 */}
        <audio
          preload="auto"
          className="hidden"
          ref={audioRef}
          // 下一曲了
          onEnded={() => playNext()}
          // 切歌存新的时间
          onDurationChange={(e) => {
            const duration = e.currentTarget.duration;
            if (isFinite(duration) && duration > 0) {
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
              } else {
                // 如果 persistedTime 为 0，说明是切歌，强制 currentTime 归零并写入 store
                audio.currentTime = 0;
                useTimeStore.getState().setCurrentTime(0);
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
export default function MainLayout({
  children,
}: {
  children?: ReactNode;
}) {
  const isHydrated = useHasHydrated();

  if (!isHydrated) {
    return <MainLayoutSkeleton />;
  }

  return <MainLayoutInner>{children}</MainLayoutInner>;
}

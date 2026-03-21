'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { ReactNode, useEffect, useRef, useCallback } from "react";

import Header from "../components/Header";
import { Sidebar } from "../components/Sidebar";
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKELETON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


function MainLayoutInner({
  children,
}: {
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const clearSearchQuery = useSearchStore((s) => s.clearQuery);

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

  const { defaultLayout, onLayoutChanged: originalOnLayoutChanged } = useDefaultLayout({
    groupId: "music-player-layout",
  });

  // 防抖 onLayoutChanged，避免拖拽时高频写 localStorage
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Layout 类型是 { [id: string]: number }
  const debouncedLayoutChanged = useCallback((layout: { [id: string]: number }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      originalOnLayoutChanged(layout);
    }, 300);
  }, [originalOnLayoutChanged]);

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
          onLayoutChanged={debouncedLayoutChanged}
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

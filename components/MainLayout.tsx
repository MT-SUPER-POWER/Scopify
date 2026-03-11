'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { ReactNode, createContext, useContext, useEffect, useState } from "react";

import Header from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { PlayerBar } from "../components/PlayerBar";
import { SearchModal } from "../components/SearchModal";

// status store
import { useUiStore } from "@/store/module/ui";


// lib
import { cn } from "@/lib/utils";
import { usePanelRef, useDefaultLayout } from "react-resizable-panels";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable";

// self components
import MainLayoutSkeleton from "./MainLayout/Skeleton";
import LyricsModal from "../components/LyricModal";

// hooks
import { useHasHydrated } from "@/lib/hooks/useHydration";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LYRICS CONTEXT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface LyricsContextType {
  isLyricsOpen: boolean;
  openLyrics: () => void;
  closeLyrics: () => void;
  toggleLyrics: () => void;
}

const LyricsContext = createContext<LyricsContextType | undefined>(undefined);

export const useLyrics = () => {
  const ctx = useContext(LyricsContext);
  if (!ctx) throw new Error("useLyrics must be used within a provider");
  return ctx;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKELETON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * MainLayout: 播放器的子组件 - 支持懒加载 + 骨架屏
 */
function MainLayoutInner({
  children,
}: {
  children?: ReactNode;
}) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    groupId: "music-player-layout",
    storage: typeof window !== "undefined" ? localStorage : undefined
  });
  const panelRef = usePanelRef();
  const isSearchOpen = useUiStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useUiStore((s) => s.setIsSearchOpen);
  const isLyricsOpen = useUiStore((s) => s.isLyricsOpen);
  const setIsLyricsOpen = useUiStore((s) => s.setIsLyricsOpen);
  const toggleLyrics = useUiStore((s) => s.toggleLyrics);
  const setIsCollapsed = useUiStore((s) => s.setIsCollapsed);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const isCollapsed = useUiStore(s => s.isCollapsed);

  // 监听子组件的 collapse/expand 事件并同步状态
  useEffect(() => {
    if (isCollapsed) {
      panelRef.current?.collapse();
    } else {
      panelRef.current?.expand();
    }
  }, [isCollapsed]);

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

  const lyricsCtx: LyricsContextType = {
    isLyricsOpen,
    openLyrics: () => setIsLyricsOpen(true),
    closeLyrics: () => setIsLyricsOpen(false),
    toggleLyrics,
  };

  return (
    <LyricsContext.Provider value={lyricsCtx}>
      {/* 上下结构 */}
      <div className={cn(
        "w-full h-full flex flex-col bg-black text-white font-sans",
        "overflow-hidden select-none p-2 gap-2"
      )}>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <LyricsModal />

        {/*
        左右结构
        TODO: dashboard 右侧响应式有问题
         */}
        <div className="flex-1 min-h-0 relative w-full">
          <ResizablePanelGroup
            orientation="horizontal"
            defaultLayout={defaultLayout}
            onLayoutChanged={onLayoutChanged}
            className="w-full h-full"
          >
            <ResizablePanel
              panelRef={panelRef}
              defaultSize="20%"
              minSize="15%"
              maxSize="40%"
              collapsible
              collapsedSize={80}
              onResize={() => setIsCollapsed(panelRef.current?.isCollapsed() ?? false)}
              className={cn(
                "bg-[#0f0f0f] rounded-lg overflow-hidden transition-all duration-300 ease-in-out",
              )}
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

                <ScrollArea className="h-full w-full" viewportRef={setScrollContainer}>
                  {children}
                </ScrollArea>

                <SearchModal
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                />

                <LyricsModal />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <PlayerBar />
      </div>
    </LyricsContext.Provider>
  );
}

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

'use client';

import Header from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { PlayerBar } from "../components/PlayerBar";
import { SearchModal } from "../components/SearchModal";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { LyricsModal } from "../components/LyricModal";
import { LyricsProvider } from "../components/LyricsContext";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePanelRef, useDefaultLayout } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * MainLayout: 播放器的壳子组件
 * 负责渲染 Sidebar, Header, PlayerBar 以及中间的内容区域
 */
export default function MainLayout({
  children,
}: {
  children?: ReactNode;
}) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    groupId: "music-player-layout",
    storage: typeof window !== "undefined" ? localStorage : undefined
  });

  const panelRef = usePanelRef();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollapsed, setIsPanelCollapsed] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const panelAPI = useMemo(() => {
    return {
      collapse: () => panelRef.current?.collapse(),
      expand: () => panelRef.current?.expand()
    }
  }, [panelRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  return (
    <LyricsProvider>
      {/* 上下结构 */}
      <div className={cn(
        "w-full h-screen flex flex-col bg-black text-white font-sans",
        "overflow-hidden select-none p-2 gap-2"
      )}>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <LyricsModal />

        {/* 左右结构 */}
        <div className="flex-1 min-h-0 relative">
          <ResizablePanelGroup orientation="horizontal"
            defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
            <ResizablePanel
              panelRef={panelRef}
              defaultSize="20%"
              minSize="15%"
              maxSize="40%"
              collapsible
              collapsedSize={80}
              onResize={() => setIsPanelCollapsed(panelRef.current?.isCollapsed() ?? false)}
              className={cn(
                "bg-[#0f0f0f] rounded-lg overflow-hidden transition-all duration-300 ease-in-out",
              )}
            >
              <Sidebar isVeryNarrow={isCollapsed} panelAPI={panelAPI} />
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
              <div className="h-full bg-[#121212] rounded-lg relative flex flex-col overflow-hidden">
                <Header onOpenSearch={() => setIsSearchOpen(true)} scrollContainer={scrollContainer} />
                <ScrollArea className="flex-1 min-h-0 overflow-y-auto" viewportRef={setScrollContainer}>
                  {children}
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <PlayerBar />
      </div>
    </LyricsProvider >
  );
}

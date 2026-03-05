'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import Header from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { PlayerBar } from "../components/PlayerBar";
import { MockRouterContent } from "../components/MockRouterContent";
import { SearchModal } from "../components/SearchModal";
import { ReactNode, useEffect, useRef, useState } from "react";
import { LyricsModal } from "../components/LyricModal";
import { LyricsProvider } from "../components/LyricsContext";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PanelImperativeHandle, usePanelRef, useDefaultLayout } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MusicPlayerLayout({
  children,
}: {
  children?: ReactNode;
}) {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ VARIABLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


  /*
    BUG: 不知道为什么还是会走 node.js 去找 localStorage 导致报错
    但是功能正确，我就不管了，报错不影响使用，报错也只是再刷新页面的时候出现
  */
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    groupId: "unique-group-id",
    storage: localStorage
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollapsed, setIsPanelCollapsed] = useState(false);
  const panelRef = usePanelRef(); // NOTE: usePanelRef 是这个库专门提供的 hook，用于获取 Panel 的命令式句柄

  // 全局快捷键监听
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
      <div className="w-full h-screen flex flex-col bg-black text-white font-sans overflow-hidden select-none p-2 gap-2">
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <LyricsModal />

        {/* 可拖拽面板组件 */}
        <div className="flex-1 min-h-0 relative">
          <ResizablePanelGroup orientation="horizontal"
            defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
            {/* 左侧侧边栏 */}
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
              {/* TODO: 实现 collapsible 被子组件控制 */}
              <Sidebar isVeryNarrow={isCollapsed} />
            </ResizablePanel>

            {/* 拖拽柄 - 透明但有感应热区 */}
            <ResizableHandle
              className={cn(
                // 基础热区设置（透明，保证好点）
                "w-2 bg-transparent relative flex items-center justify-center transition-colors",
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",

                // 利用 after 伪元素画一条居中的绝对定位的细线
                "after:absolute after:inset-y-0 after:w-px after:bg-transparent after:transition-colors",

                // 悬浮时细线微微变亮
                "hover:after:bg-white/10",

                // 拖拽（按住）时细线高亮
                "data-[resize-handle-state=drag]:after:bg-white/30"
              )}
            />

            {/* 右侧主内容 */}
            <ResizablePanel defaultSize={80}>
              <div className="h-full bg-[#121212] rounded-lg relative flex flex-col min-w-0">
                <Header onOpenSearch={() => setIsSearchOpen(true)} />
                <ScrollArea className="flex-1 overflow-y-auto relative">
                  {children ? children : <MockRouterContent />}
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

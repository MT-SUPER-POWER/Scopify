"use client";

import { Sidebar } from "./components/Sidebar";
import Header from "./components/Header";
import { PlayerBar } from "./components/PlayerBar";
import { MockRouterContent } from "./components/MockRouterContent";
import { SearchModal } from "./components/SearchModal";
import { ReactNode, useEffect, useState } from "react";

export default function MusicPlayerLayout({
  children,
}: {
  children?: ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 全局快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 捕获 Ctrl+K 或 Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); // 极其重要：阻止浏览器默认的搜索栏跳转行为
        setIsSearchOpen((prev) => !prev);
      }
      // 捕获 ESC 关闭面板
      if (e.key === "Escape" && isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false); // 直接关闭，不是 toggle
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown); // 卸载组件时清理监听器，防止内存泄漏
  }, [isSearchOpen]);

  return (
    // 外层容器：纯黑背景，包含所有模块
    <div className="w-full h-screen flex flex-col bg-black text-white font-sans overflow-hidden select-none">
      {/* 挂载搜索模态框 */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* 核心内容区：现代 Spotify 是卡片式分离的布局 */}
      <div className="flex-1 flex flex-row overflow-hidden p-2 gap-2 pb-0">
        {/* 左侧栏卡片 */}
        <Sidebar />

        {/* 右侧主内容卡片 */}
        <div className="flex-1 bg-[#121212] rounded-lg relative overflow-hidden flex flex-col min-w-0">
          <Header onOpenSearch={() => setIsSearchOpen(true)} />

          {/* 滚动区域 */}
          <main
            className="flex-1 overflow-y-auto relative
            [&::-webkit-scrollbar]:w-3
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-transparent
            hover:[&::-webkit-scrollbar-thumb]:bg-white/30
            [&::-webkit-scrollbar-thumb]:border-[3px]
            [&::-webkit-scrollbar-thumb]:border-[#121212]
            [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {children ? children : <MockRouterContent />}
          </main>
        </div>
      </div>

      {/* 底部固定播放条 */}
      <PlayerBar />
    </div>
  );
}

"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Home } from "lucide-react";
import RightActions from "./Header/RightActions";
import { useEffect, useState } from "react";
import os from "node:os";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Header = ({
  onOpenSearch,
  scrollContainer     // 受监听的另一个组件，监听是否其发生滚动，如果是，则 Header 显示背景，否则透明
}: {
  onOpenSearch?: () => void;
  scrollContainer: HTMLDivElement | null
}) => {

  const [isAtTop, setIsAtTop] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsAtTop(scrollContainer.scrollTop === 0);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [scrollContainer]);

  return (
    <div
      className={cn(
        "h-16 w-full flex items-center justify-between px-6 shrink-0 absolute gap-2 lg:gap-0",
        "top-0 z-20",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-momo-grey/10 backdrop-blur-lg -z-10 transition-opacity duration-300 rounded-[10px]",
          isAtTop ? "opacity-0" : "opacity-100 border-b border-white/5"
        )}
      />

      {/* Navigation Arrows & Search */}
      <div className="flex items-center gap-4">
        {/* Router 前进后退操作 */}
        <div className="flex gap-2">
          <button onClick={() => router.back()}
            className={cn(
              "w-10 h-10 rounded-full bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white"
            )}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => router.forward()}
            className={cn(
              "w-10 h-10 rounded-full bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white"
            )}>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 搜索入口 */}
      <div className="flex flex-row gap-2 items-center justify-center">

        <Link
          href="/"
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "text-zinc-400 hover:text-white bg-[#242424]",
            "active:scale-95 transition-all duration-150" // 点击时缩小到95%，并带动画
          )}
        >
          <Home className="w-6 h-6" />
        </Link>

        <button
          onClick={onOpenSearch}
          className={cn(
            "flex items-center gap-2 bg-[#242424] hover:bg-[#2a2a2a] transition-colors rounded-full",
            "px-4 py-3 flex-1 max-w-150 sm:max-w-100 md:max-w-125 group",
            "cursor-pointer border border-transparent hover:border-zinc-700/50",
            "min-w-30",
          )}
        >

          <Search className="w-6 h-6 shrink-0 text-zinc-400 group-hover:text-white" />
          {/* TODO: 接入网易搜索 API，切换为 shadcn 输入组件 */}
          <span className="text-zinc-400 font-medium text-sm flex-1 text-left group-hover:text-white truncate">
            What do you want to play?
          </span>
          <div className="flex items-center gap-1 shrink-0 text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
            <span>{os.type() === "Darwin" ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </div>
        </button>

      </div>

      {/* Right Actions */}
      <RightActions />

    </div>
  );
};

export default Header;

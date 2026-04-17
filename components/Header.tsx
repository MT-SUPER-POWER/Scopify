"use client";

import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import RightActions from "./Header/RightActions";
import HeaderSearch from "./SearchContents/HeaderSearch";

const NAV_BTN = "bg-black/50 hover:bg-black/70";

export default function Header({
  scrollContainer,
}: {
  onOpenSearch?: () => void;
  scrollContainer: HTMLDivElement | null;
}) {
  const [isAtTop, setIsAtTop] = useState(true);
  const smartRouter = useSmartRouter();

  useEffect(() => {
    if (!scrollContainer) return;
    const handleScroll = () => setIsAtTop(scrollContainer.scrollTop === 0);
    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [scrollContainer]);

  return (
    <div
      className={cn(
        "h-16 w-full flex items-center justify-between px-4 lg:px-6 shrink-0 absolute gap-3",
        "top-0 z-20",
      )}
    >
      {/* 滚动时的背景遮罩 */}
      <div
        className={cn(
          "absolute inset-0 bg-momo-grey/10 backdrop-blur-lg -z-10 transition-opacity duration-300 rounded-[10px]",
          isAtTop ? "opacity-0" : "opacity-100 border-b border-white/5",
        )}
      />

      {/* 左侧导航箭头 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => smartRouter.back()}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "text-zinc-500 hover:text-white transition-all",
            NAV_BTN,
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => smartRouter.forward()}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "text-zinc-500 hover:text-white transition-all",
            NAV_BTN,
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 中间搜索区域 */}
      <div className="flex flex-row gap-2 items-center justify-center flex-1 mx-2 md:mx-4 max-w-100">
        <Link
          href="/"
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            "text-zinc-500 hover:text-white transition-all active:scale-95",
            NAV_BTN,
            "hidden md:flex",
          )}
        >
          <Home className="w-4.5 h-4.5" />
        </Link>

        <HeaderSearch />
      </div>

      {/* 右侧操作区 */}
      <div className="shrink-0">
        <RightActions />
      </div>
    </div>
  );
}

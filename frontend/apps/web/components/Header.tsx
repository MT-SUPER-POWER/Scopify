"use client";

import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useNavigationScroll } from "@/components/shared/NavigationScrollProvider";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import RightActions from "./Header/RightActions";
import HeaderSearch from "./SearchContents/HeaderSearch";

const NAV_BTN = "bg-black/50 hover:bg-black/70";

export default function Header() {
  const { isAtTop } = useNavigationScroll();
  const smartRouter = useSmartRouter();

  return (
    <div
      className={cn(
        "absolute flex h-16 w-full shrink-0 items-center justify-between gap-3 px-4 lg:px-6",
        "top-0 z-20",
      )}
    >
      {/* 滚动时的背景遮罩 */}
      <div
        className={cn(
          "bg-momo-grey/10 absolute inset-0 -z-10 rounded-[10px] backdrop-blur-lg transition-opacity duration-300",
          isAtTop ? "opacity-0" : "border-b border-white/5 opacity-100",
        )}
      />

      {/* 左侧导航箭头 */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => smartRouter.back()}
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            "text-zinc-500 transition-all hover:text-white",
            NAV_BTN,
          )}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => smartRouter.forward()}
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            "text-zinc-500 transition-all hover:text-white",
            NAV_BTN,
          )}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* 中间搜索区域 */}
      <div className="mx-2 flex max-w-100 flex-1 flex-row items-center justify-center gap-2 md:mx-4">
        <Link
          href="/"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            "text-zinc-500 transition-all hover:text-white active:scale-95",
            NAV_BTN,
            "hidden md:flex",
          )}
        >
          <Home className="size-4.5" />
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

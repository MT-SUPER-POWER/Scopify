"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import RightActions from "./RightActions";
import HeaderSearch from "@/components/SearchContents/HeaderSearch";
import { useNavigationScroll } from "@/components/shared/NavigationScrollProvider";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { headerStyles } from "@/styles";

const NAV_BTN = "bg-surface-sunken/80 hover:bg-surface-elevated";

export function Header() {
  const { isAtTop } = useNavigationScroll();
  const smartRouter = useSmartRouter();

  return (
    <div
      className={cn(
        headerStyles.root,
        "absolute flex h-16 w-full shrink-0 items-center justify-between gap-3 px-3 lg:px-6",
        "top-0 z-20",
      )}
    >
      {/* 滚动时的背景遮罩 */}
      <div
        className={cn(
          "absolute inset-0 -z-10 rounded-lg bg-surface-overlay/80 backdrop-blur-lg transition-opacity duration-300 group-data-[lattice-active=true]/main:opacity-0",
          isAtTop ? "opacity-0" : "border-b border-border opacity-100",
        )}
      />

      {/* 左侧导航箭头 */}
      <div className={cn(headerStyles.history, "flex shrink-0 items-center gap-2")}>
        <button
          onClick={() => smartRouter.back()}
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            "text-content-muted transition-all hover:text-content",
            NAV_BTN,
          )}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => smartRouter.forward()}
          className={cn(
            headerStyles.forward,
            "flex size-10 items-center justify-center rounded-full",
            "text-content-muted transition-all hover:text-content",
            NAV_BTN,
          )}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* 中间搜索区域 */}
      <div
        className={cn(
          headerStyles.search,
          "mx-2 flex max-w-100 min-w-0 flex-1 flex-row items-center justify-center gap-2 md:mx-4",
        )}
      >
        <HeaderSearch />
      </div>

      {/* 右侧操作区 */}
      <div className="shrink-0">
        <RightActions />
      </div>
    </div>
  );
}

export default Header;

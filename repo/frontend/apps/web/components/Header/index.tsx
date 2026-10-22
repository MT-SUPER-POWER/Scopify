"use client";

import { ChevronLeft, ChevronRight, List } from "lucide-react";
import RightActions from "./RightActions";
import HeaderSearch from "@/components/SearchContents/HeaderSearch";
import { useIsScrollAtTop } from "@/components/shared/NavigationScrollProvider";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useLatticeView } from "@/store/module/lattice";
import { headerStyles } from "@/styles";

const NAV_BTN = "bg-surface-sunken/80 hover:bg-surface-elevated";

export function Header() {
  const { t } = useI18n();
  const isAtTop = useIsScrollAtTop();
  const smartRouter = useSmartRouter();
  const latticeActive = useLatticeView((state) => state.active);
  const latticeController = useLatticeView((state) => state.controller);

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
        {latticeActive && latticeController && (
          <button
            type="button"
            onClick={latticeController.close}
            aria-label={t("playlist.lattice.back")}
            title={`${t("playlist.lattice.back")} · Esc`}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium",
              "text-content-muted transition-all hover:text-content",
              NAV_BTN,
            )}
          >
            <List className="size-4" />
            <span className="hidden sm:inline">{t("playlist.lattice.back")}</span>
          </button>
        )}
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

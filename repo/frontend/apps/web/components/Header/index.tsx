"use client";

import RightActions from "./RightActions";
import { HeaderHistoryNav } from "./HeaderHistoryNav";
import { HeaderHomeButton } from "./HeaderHomeButton";
import HeaderSearch from "@/components/search/HeaderSearch";
import { ScopifyBrand } from "@/components/shared/ScopifyBrand";
import { cn } from "@/lib/utils";

import { headerStyles } from "@/styles";

/** 横跨整个窗口的顶栏：左侧品牌与历史导航（仅桌面端），中间首页与搜索，右侧通知/私信/头像。 */
export function Header() {
  return (
    <header
      className={cn(
        headerStyles.root,
        "relative flex h-12 w-full shrink-0 items-center justify-between gap-3",
      )}
    >
      {/* 左侧品牌与导航箭头 */}
      <div className={cn(headerStyles.history, "flex min-w-0 items-center gap-2")}>
        <ScopifyBrand priority className="mx-2 min-w-0" wordmarkClassName={headerStyles.wordmark} />
        <HeaderHistoryNav />
      </div>

      {/* 中间首页按钮与搜索：相对整个窗口居中，不受两侧为窗口按钮让出的不对称内边距影响 */}
      <div className={cn(headerStyles.search, headerStyles.noDrag, headerStyles.center)}>
        <HeaderHomeButton />
        <HeaderSearch />
      </div>

      {/* 右侧操作区 */}
      <div className="flex min-w-0 items-center justify-end">
        <div className={headerStyles.noDrag}>
          <RightActions />
        </div>
      </div>
    </header>
  );
}

export default Header;

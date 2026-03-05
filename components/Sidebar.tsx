"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Library } from "lucide-react"
import playlist from "@/assets/data/playlist.json";
import artist from "@/assets/data/artist.json";
import React, { useReducer } from "react";
import { cn } from "@/lib/utils";
import { LibraryItem } from "./LibraryItem";
import { SiderBarMenu } from "./Siderbar/SiderbarMenu";
import { FilterMenu } from "./Siderbar/FilterMenu";
import { ScrollArea } from "@/components/ui/scroll-area";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reducer(_state: 0 | 1 | 2, action: { type: "ALL" | "PLAYLISTS" | "ARTISTS" }) {
  switch (action.type) {
    case "ALL": return 0;
    case "PLAYLISTS": return 1;
    case "ARTISTS": return 2;
    default: throw new Error();
  }
}

interface SidebarProps {
  isVeryNarrow?: boolean;   // 外部如果折叠了，里面就会传入 true
  panelAPI?: {
    collapse: () => void | undefined;
    expand: () => void | undefined;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MAIN UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Sidebar = React.memo(({
  isVeryNarrow,
  panelAPI
}: SidebarProps) => {
  const [filterState, filterDispatch] = useReducer(reducer, 0);

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full",
        "transition-all duration-300 ease-in-out",
        (isVeryNarrow && "gap-3")
      )}
    >

      {/* Header */}
      <div className={cn(
        "group/header flex items-center py-4 px-3 text-zinc-400 shrink-0",
        // 如果极度狭小，我们居中只展示单个库图标。如果没那么窄或者是收纳模式，横向排布并两边推开
        (isVeryNarrow) ? "justify-center" : "justify-between"
      )}>
        {/* 左侧区域: Library Icon + (按需显示的 Text) */}
        <div className={cn(
          "flex items-center hover:text-white cursor-pointer",
          "transition-colors font-semibold overflow-hidden",
          "gap-2"
        )}>
          <Library className={cn(
            "w-6 h-6 transition-transform shrink-0",
            (isVeryNarrow && "w-8 h-8")
          )}
          />
          {/* 当未折叠且宽度允许时，才显示 Your Library 文字 */}
          {!isVeryNarrow && (<span className="truncate min-w-0">Your Library</span>)}
        </div>

        {/* 右侧区域: 按钮或汉堡菜单 */}
        {!isVeryNarrow &&
          <div className="flex items-center shrink-0 text-zinc-400">
            <SiderBarMenu panelAPI={panelAPI} />
          </div>
        }
      </div>

      {/* 歌单过滤选择 */}
      {!isVeryNarrow ? (
        <div className="flex gap-2 px-4 mb-2 overflow-x-auto shrink-0 scrollbar-custom-h">
          {(["ALL", "PLAYLISTS", "ARTISTS"] as const).map((type, idx) => (
            <button
              key={type}
              onClick={() => filterDispatch({ type })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition-all flex justify-center shrink-0",
                filterState === idx ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
              )}
            >
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      ) : (
        <div className={cn(
          // w-fit 让容器收缩到内容宽度，mx-auto 保证其在父级的 flex-col 中居中
          "w-fit mx-auto -mt-2 flex items-center justify-center",
          "p-1 rounded-sm",
          "hover:bg-[#2a2a2a] transition-all text-zinc-400 hover:text-white"
        )}>
          <FilterMenu panelAPI={panelAPI} filterHook={{ state: filterState, dispatch: filterDispatch }} />
        </div>
      )}

      {/* 曲库 */}
      <ScrollArea className={cn(
        "flex-1 w-full scrollbar-custom",
        isVeryNarrow ? "px-0" : "px-2"
      )}>
        <div className="space-y-1 pb-2">
          {(filterState === 0 || filterState === 1) &&
            playlist.map((item) => (
              <LibraryItem
                key={item.id}
                {...item}
                isCollapsed={isVeryNarrow}
              />
            ))}

          {(filterState === 0 || filterState === 2) &&
            artist.map((item) => (
              <LibraryItem
                key={item.id}
                {...item}
                isCollapsed={isVeryNarrow}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
});

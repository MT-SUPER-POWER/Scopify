"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Library } from "lucide-react"
import React, { useEffect, useReducer } from "react";
import { useUiStore } from "@/store/module/ui";
import { cn } from "@/lib/utils";
import { LibraryItem } from "./LibraryItem";
import { SiderBarMenu } from "./Siderbar/SiderbarMenu";
import { FilterMenu } from "./Siderbar/FilterMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUserPlaylist } from "@/lib/api/playlist";
import { useUserStore } from "@/store";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { FilterAction, FilterState, SidebarProps } from "@/types/components/Siderbar";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reducer(_state: FilterState, action: FilterAction) {
  switch (action.type) {
    case "ALL": return 0;
    case "CREATED": return 1;
    case "SUBSCRIBED": return 2;
    default: throw new Error();
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SidebarImpl({ panelAPI }: SidebarProps) {
  const isVeryNarrow = useUiStore(s => s.isCollapsed);
  const [filterState, filterDispatch] = useReducer(reducer, 0);
  const isUserLogin = useLoginStatus();

  // 1. 拿到经过 Type 约束的数据
  const playlists = useUserStore(s => s.playlist);
  // const artists = useUserStore(s => s.artist) || [];

  // 请求歌单列表
  useEffect(() => {
    if (!isUserLogin) return;
    const uid = useUserStore.getState().user?.userId;

    (async () => {
      try {
        const userPlaylistRes = await getUserPlaylist(uid!);
        if (userPlaylistRes.data.code === 200) {
          useUserStore.setState({ playlist: userPlaylistRes.data.playlist });
        }
      } catch (e) {
        console.error("获取歌单失败", e);
      }
    })();
  }, [isUserLogin]);

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full transition-all duration-300 ease-in-out",
        isVeryNarrow && "gap-3"
      )}
    >
      {/* Header 区 */}
      <div className={cn("group/header flex items-center py-4 px-3 text-zinc-400 shrink-0", isVeryNarrow ? "justify-center" : "justify-between")}>
        <div className={cn("flex items-center hover:text-white cursor-pointer transition-colors font-semibold overflow-hidden gap-2")}>
          <Library className={cn("w-6 h-6 transition-transform shrink-0", isVeryNarrow && "w-8 h-8")} />
          {!isVeryNarrow && (<span className="truncate min-w-0">Your Library</span>)}
        </div>
        {!isVeryNarrow && <div className="flex items-center shrink-0 text-zinc-400"><SiderBarMenu panelAPI={panelAPI} /></div>}
      </div>

      {/* 过滤区 */}
      {!isVeryNarrow ? (
        <div className="flex gap-2 px-4 mb-2 overflow-x-auto shrink-0 scrollbar-custom-h">
          {(["ALL", "CREATED", "SUBSCRIBED"] as const).map((type, idx) => (
            <button
              key={type}
              onClick={() => filterDispatch({ type })}
              className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-all flex justify-center shrink-0", filterState === idx ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#2a2a2a]")}
            >
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      ) : (
        <div className="w-fit mx-auto -mt-2 flex items-center justify-center p-1 rounded-sm hover:bg-[#2a2a2a] transition-all text-zinc-400 hover:text-white">
          <FilterMenu panelAPI={panelAPI} filterHook={{ state: filterState, dispatch: filterDispatch }} />
        </div>
      )}

      {/* 曲库渲染区 */}
      <ScrollArea className={cn("flex-1 w-full scrollbar-custom", isVeryNarrow ? "px-0" : "px-2")}>
        <div className="space-y-1 pb-2">

          {/* 渲染创建的歌单 (subscribed: false) */}
          {(filterState === 0 || filterState === 1) &&
            playlists
              .filter(item => !item.subscribed)
              .map((item) => (
                <LibraryItem
                  key={item.id}
                  id={item.id}
                  title={item.name}
                  subtitle={`Playlist • You`}
                  coverImg={`${item.coverImgUrl}?param=100y100`}
                  isCollapsed={isVeryNarrow}
                />
              ))}

          {/* 渲染收藏的歌单 (subscribed: true) */}
          {(filterState === 0 || filterState === 2) &&
            playlists
              .filter(item => item.subscribed)
              .map((item) => (
                <LibraryItem
                  key={item.id}
                  id={item.id}
                  title={item.name}
                  subtitle={`Playlist • ${item.creator?.nickname || '未知用户'}`}
                  coverImg={`${item.coverImgUrl}?param=100y100`}
                  isCollapsed={isVeryNarrow}
                />
              ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export const Sidebar = React.memo(SidebarImpl);

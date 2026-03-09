"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Library, RefreshCw, ListMusic, LogIn, Search } from "lucide-react"
import React, { useEffect, useReducer, useState } from "react";
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
import { useIsElectron } from "@/lib/hooks/useElectronDetect";
import { toast } from "sonner";
import { Button } from "./ui/button";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isElectron = useIsElectron();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const handleLoginClick = () => {
  if (typeof window !== "undefined" && isElectron) {
    window.electronAPI?.openLoginWindow();
  } else {
    window.location.href = '/login';
  }
};

function reducer(_state: FilterState, action: FilterAction) {
  switch (action.type) {
    case "ALL": return 0;
    case "CREATED": return 1;
    case "SUBSCRIBED": return 2;
    default: throw new Error();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SUB COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ActionCardProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onClick: () => void;
}

function ActionCard({ title, subtitle, buttonText, onClick }: ActionCardProps) {
  return (
    <div className="bg-[#242424] rounded-lg p-4 flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-white font-bold text-[15px]">{title}</span>
        <span className="text-zinc-400 text-[13px]">{subtitle}</span>
      </div>
      <button
        onClick={onClick}
        className="bg-white text-black font-bold text-[13px] px-4 py-1.5 rounded-full hover:scale-105 hover:bg-gray-100 transition-all"
      >
        {buttonText}
      </button>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex gap-3 items-center p-2 rounded-md animate-pulse">
      <div className="w-12 h-12 bg-[#242424] rounded-md shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-3 bg-[#242424] rounded-full w-3/4" />
        <div className="h-2 bg-[#242424] rounded-full w-1/2" />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SidebarImpl({ panelAPI }: SidebarProps) {
  const isVeryNarrow = useUiStore(s => s.isCollapsed);
  const [filterState, filterDispatch] = useReducer(reducer, 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUserLogin = useLoginStatus();
  const playlists = useUserStore(s => s.playlist);

  // 请求歌单列表
  const fetchPlaylist = async () => {
    if (!isUserLogin) return;
    const uid = useUserStore.getState().user?.userId;
    setIsLoading(true);
    setError(null);
    try {
      const userPlaylistRes = await getUserPlaylist(uid!);
      if (userPlaylistRes.data.code === 200) {
        useUserStore.setState({ playlist: userPlaylistRes.data.playlist });
      }
    } catch (e) {
      console.error("获取歌单失败", e);
      setError(e instanceof Error ? e.message : "获取歌单失败");
      toast.error("获取歌单失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [isUserLogin]);

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full transition-all duration-300 ease-linear",
        !isVeryNarrow && "bg-momo-dark",
        isVeryNarrow ? "gap-3" : "gap-[6.5px]",
      )}
    >

      {/* 头部区域 */}
      <div className={cn("bg-[#121212] rounded-md", "flex flex-col gap-1")}>
        {/* Header 区 */}
        <div className={cn(
          "group/header flex items-center py-4 px-3 text-zinc-400 shrink-0",
          isVeryNarrow ? "justify-center" : "justify-between"
        )}>
          <div className={cn(
            "flex items-center hover:text-white cursor-pointer transition-colors",
            "font-semibold overflow-hidden gap-2"
          )}>
            <Library className={cn("w-7 h-7 transition-transform shrink-0", isVeryNarrow && "w-8 h-8")} />
            {!isVeryNarrow && <span className="truncate min-w-0">Your Library</span>}
          </div>
          {!isVeryNarrow && (
            <div className="flex items-center shrink-0 text-zinc-400">
              <SiderBarMenu panelAPI={panelAPI} />
            </div>
          )}
        </div>

        {/* 过滤区 */}
        {!isVeryNarrow ? (
          <div className="flex gap-2 px-4 mb-2 overflow-x-auto shrink-0 scrollbar-custom-h">
            {(["ALL", "CREATED", "SUBSCRIBED"] as const).map((type, idx) => (
              <Button
                key={type}
                onClick={() => filterDispatch({ type })}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition-all flex justify-center shrink-0",
                  filterState === idx ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
                )}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        ) : (
          <div className="w-fit mx-auto -mt-2 flex items-center justify-center p-1 rounded-sm hover:bg-[#2a2a2a] transition-all text-zinc-400 hover:text-white">
            <FilterMenu panelAPI={panelAPI} filterHook={{ state: filterState, dispatch: filterDispatch }} />
          </div>
        )}
      </div>

      {/* 曲库渲染区 */}
      <ScrollArea className={cn(
        "flex-1 w-full scrollbar-custom",
        isVeryNarrow ? "px-0" : "px-2",
        "bg-[#121212] rounded-md"
      )}>
        <div className={cn("space-y-1", isVeryNarrow ? "pb-2" : "py-4")}>

          {/* ── 1. 加载中：骨架屏 ── */}
          {isLoading ? (
            isVeryNarrow ? (
              <div className="flex flex-col gap-3 items-center mt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 bg-[#242424] rounded-md animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-1 px-1">
                {[1, 2, 3].map(i => <SkeletonItem key={i} />)}
              </div>
            )

            /* ── 2. 网络请求失败 ── */
          ) : error ? (
            isVeryNarrow ? (
              <div className="flex flex-col items-center gap-2 mt-4 text-zinc-500">
                <RefreshCw className="w-6 h-6" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title="加载歌单失败"
                  subtitle={error}
                  buttonText="重试"
                  onClick={fetchPlaylist}
                />
              </div>
            )

            /* ── 3. 未登录 ── */
          ) : !isUserLogin ? (
            isVeryNarrow ? (
              <div className="flex flex-col items-center gap-4 mt-4 text-zinc-500">
                <button className="p-2 hover:bg-[#242424] hover:text-white rounded-md transition-colors" title="登录以查看歌单">
                  <LogIn className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title="登录以查看你的歌单"
                  subtitle="登录后即可访问你创建或收藏的所有歌单。"
                  buttonText="登录"
                  onClick={() => { handleLoginClick() }}
                />
              </div>
            )
            /* ── 3. 已登录但歌单为空 ── */
          ) : playlists.length === 0 ? (
            isVeryNarrow ? (
              <div className="flex flex-col items-center gap-4 mt-4 text-zinc-500">
                <button
                  onClick={fetchPlaylist}
                  className="p-2 hover:bg-[#242424] hover:text-white rounded-md transition-colors"
                  title="重新加载"
                >
                  <ListMusic className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title="你还暂时没有歌单"
                  subtitle="可以创建歌单，或在网易云中收藏歌单后重新加载。"
                  buttonText="重新加载"
                  onClick={fetchPlaylist}
                />
              </div>
            )
          ) : (
            /* ── 4. 已登录且有数据：正常渲染 ── */
            <>
              {/* 渲染创建的歌单 (subscribed: false) */}
              {(filterState === 0 || filterState === 1) &&
                playlists
                  .filter(item => !item.subscribed)
                  .map((item) => (
                    <LibraryItem
                      key={item.id}
                      id={item.id}
                      title={item.name}
                      subtitle="Playlist • You"
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
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}

export const Sidebar = React.memo(SidebarImpl);

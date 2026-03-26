"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Library, RefreshCw, ListMusic, User } from "lucide-react"
import React, { useEffect, useReducer, useState } from "react";
import { cn, IS_ELECTRON } from "@/lib/utils";
import { LibraryItem } from "./Siderbar/LibraryItem";
import { SiderBarMenuMemo } from "./Siderbar/SiderbarMenu";
import { FilterMenu } from "./Siderbar/FilterMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUserLikeLists, getUserPlaylist } from "@/lib/api/playlist";
import { useUserStore } from "@/store";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { FilterAction, FilterState } from "@/types/components/Siderbar";
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import { toast } from "sonner";
import { Button } from "./ui/button";
import { CollapsibleLibraryGroup } from "./Siderbar/CollapsibleLibraryGroup";
import { FaCompactDisc, FaDiscord } from "react-icons/fa6";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ActionCardProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onClick: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reducer(_state: FilterState, action: FilterAction) {
  switch (action.type) {
    case "ALL": return 0;
    case "CREATED": return 1;
    case "SUBSCRIBED": return 2;
    default: throw new Error();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SUB COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

function SidebarImpl() {
  const [isVeryNarrow, setIsVeryNarrow] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsVeryNarrow(entry.contentRect.width <= 90);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [filterState, filterDispatch] = useReducer(reducer, 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUserLogin = useLoginStatus();
  const userName = useUserStore(s => s.user?.nickname);
  const playlists = useUserStore(s => s.playlist);
  const isElectron = IS_ELECTRON;
  const smartRouter = useSmartRouter();

  // 订阅触发器，当其他组件（如TrackTable）修改了数据并触发此状态时，Sidebar可以静默重拉
  const libraryUpdateTrigger = useUserStore(s => s.libraryUpdateTrigger);

  const fetchPlaylist = async (isSilent = false) => {
    if (!isUserLogin) return;

    const uid = useUserStore.getState().user?.userId;

    // 如果是静默更新（比如删歌触发的），我们就不显示 Loading 骨架屏，避免 UI 闪烁
    if (!isSilent) {
      setIsLoading(true);
    }
    setError(null);

    Promise.all([
      getUserPlaylist(uid!),
      getUserLikeLists(uid!)
    ]).then(([userPlaylistRes, likeListRes]) => {
      useUserStore.getState().setPlayList(userPlaylistRes.data.playlist);
      useUserStore.getState().setLikeListIDs(likeListRes.data.ids)
    }).catch((e) => {
      console.error("获取歌单或喜欢列表失败", e);
      // 静默更新失败可以不报强弹窗，只影响初始加载
      if (!isSilent) {
        setError(e instanceof Error ? e.message : "获取歌单失败");
        toast.error("获取歌单失败，请稍后再试");
      }
    }).finally(() => {
      if (!isSilent) {
        setIsLoading(false);
      }
    });
  };

  const handleLoginClick = () => {
    if (typeof window !== "undefined" && isElectron) window.electronAPI?.openLoginWindow();
    else smartRouter.replace('/login');
  }

  // 依赖监听：不仅监听登录状态，还监听 libraryUpdateTrigger
  const userId = useUserStore(s => s.user?.userId);
  useEffect(() => {
    if (isUserLogin && userId && userId !== 0) {
      // 如果 trigger > 0 说明是人为触发的更新，启用静默模式(true)
      fetchPlaylist(libraryUpdateTrigger > 0);
    }
  }, [isUserLogin, userId, libraryUpdateTrigger]); // 增加了 trigger 依赖

  const createdPlaylists = playlists.filter(item => item && item.creator.nickname === userName);
  const subscribedPlaylists = playlists.filter(item => item && item.creator.nickname !== userName);

  const renderPlaylistItems = (items: typeof playlists) => items.map((item) => (
    <LibraryItem
      key={item.id}
      id={item.id}
      title={item.name}
      subtitle={!item.subscribed ? "Playlist • You" : `Playlist • ${item.creator?.nickname || '未知用户'}`}
      coverImg={`${item.coverImgUrl}?param=100y100`}
      isCollapsed={isVeryNarrow}
    />
  ));

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-full w-full",
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
          <button
            title="Scopify"
            onClick={() => smartRouter.push("/")}
            className={cn(
              "flex items-center hover:text-white cursor-pointer transition-colors",
              "font-semibold overflow-hidden gap-3"
            )}>
            <FaCompactDisc className={cn("w-6 h-6 transition-transform shrink-0", isVeryNarrow && "w-8 h-8")} />
            {!isVeryNarrow && <span className="truncate min-w-0 text-[15px]">Scopify</span>}
          </button>
          {!isVeryNarrow && (
            <div className="flex items-center shrink-0 text-zinc-400">
              <SiderBarMenuMemo />
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
            <FilterMenu filterHook={{ state: filterState, dispatch: filterDispatch }} />
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

          {/* ── 加载中：骨架屏 ── */}
          {isLoading ? (
            isVeryNarrow ? (
              <div className="flex flex-col gap-3 items-center mt-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-10 h-10 bg-[#242424] rounded-md animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-1 px-1">
                {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} />)}
              </div>
            )
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
                  onClick={() => fetchPlaylist(false)}
                />
              </div>
            )
          ) : !isUserLogin ? (
            isVeryNarrow ? (
              <div className="flex flex-col items-center gap-4 mt-4 text-zinc-500">
                <button className={cn("p-2 hover:bg-[#242424] hover:text-white rounded-md transition-all")}
                  onClick={handleLoginClick}
                  title="Login to view playlists"
                >
                  <User className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title="Login to view your playlists"
                  subtitle="Login to view your playlists, including those you created and favorited."
                  buttonText="Login"
                  onClick={() => { handleLoginClick() }}
                />
              </div>
            )
            /* ── 已登录但歌单为空 ── */
          ) : playlists.length === 0 ? (
            isVeryNarrow ? (
              <div className="flex flex-col items-center gap-4 mt-4 text-zinc-500">
                <button
                  onClick={() => fetchPlaylist(false)}
                  className="p-2 hover:bg-[#242424] hover:text-white rounded-md transition-colors"
                  title="重新加载"
                >
                  <ListMusic className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title="You don't have any playlists yet"
                  subtitle="Create a playlist or favorite playlists on NetEase Music to see them here."
                  buttonText="Reload"
                  onClick={() => fetchPlaylist(false)}
                />
              </div>
            )
          ) : (
            /* ── 已登录且有数据：正常渲染 ── */
            <>
              {/* 渲染创建的歌单 (subscribed: false) */}
              {(filterState === 0 || filterState === 1) &&
                (isVeryNarrow ? (
                  renderPlaylistItems(createdPlaylists)
                ) : (
                  <CollapsibleLibraryGroup title="Created Playlists" defaultOpen={true}>
                    {renderPlaylistItems(createdPlaylists)}
                  </CollapsibleLibraryGroup>
                ))}

              {/* 渲染收藏的歌单 (subscribed: true) */}
              {(filterState === 0 || filterState === 2) &&
                (isVeryNarrow ? (
                  renderPlaylistItems(subscribedPlaylists)
                ) : (
                  <CollapsibleLibraryGroup title="Subscribed Playlists" defaultOpen={true}>
                    {renderPlaylistItems(subscribedPlaylists)}
                  </CollapsibleLibraryGroup>
                ))}
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}

export const Sidebar = React.memo(SidebarImpl);

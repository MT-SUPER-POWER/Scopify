"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { ListMusic, RefreshCw, User } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useReducer, useState } from "react";
import { FaCompactDisc } from "react-icons/fa6";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFollowedArtists } from "@/lib/api/artist";
import { getUserLikeLists, getUserPlaylist } from "@/lib/api/playlist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, IS_ELECTRON } from "@/lib/utils";
import { getBackendBaseUrl } from "@/lib/web/request";
import { waitForBackend } from "@/lib/web/waitForBackend";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { FollowedArtist } from "@/types/artist";
import type { FilterAction, FilterState } from "@/types/components/Siderbar";
import { CollapsibleLibraryGroup } from "./Siderbar/CollapsibleLibraryGroup";
import { FilterMenu } from "./Siderbar/FilterMenu";
import { LibraryItem } from "./Siderbar/LibraryItem";
import { SiderBarMenuMemo } from "./Siderbar/SiderbarMenu";
import { Button } from "./ui/button";

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
    case "ALL":
      return 0;
    case "CREATED":
      return 1;
    case "SUBSCRIBED":
      return 2;
    case "ARTISTS":
      return 3;
    default:
      throw new Error();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SUB COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ActionCard({ title, subtitle, buttonText, onClick }: ActionCardProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg bg-[#242424] p-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[15px] font-bold text-white">{title}</span>
        <span className="text-[13px] text-zinc-400">{subtitle}</span>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="rounded-full bg-white px-4 py-1.5 text-[13px] font-bold text-black transition-all hover:scale-105 hover:bg-gray-100"
      >
        {buttonText}
      </button>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-md p-2">
      <div className="size-12 shrink-0 rounded-md bg-[#242424]" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3 w-3/4 rounded-full bg-[#242424]" />
        <div className="h-2 w-1/2 rounded-full bg-[#242424]" />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SidebarImpl() {
  const { t } = useI18n();
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
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [artistsError, setArtistsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isUserLogin = useLoginStatus();
  const userName = useUserStore((s) => s.user?.nickname);
  const playlists = useUserStore((s) => s.playlist);
  const followedArtists = useUserStore((s) => s.followedArtists);
  const isElectron = IS_ELECTRON;
  const smartRouter = useSmartRouter();

  // 订阅触发器，当其他组件（如TrackTable）修改了数据并触发此状态时，Sidebar可以静默重拉
  const libraryUpdateTrigger = useUserStore((s) => s.libraryUpdateTrigger);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchPlaylist intentionally reads store snapshots to avoid refetch loops.
  const fetchPlaylist = React.useCallback(
    async (isSilent = false) => {
      if (!isUserLogin) return;

      const uid = useUserStore.getState().user?.userId;
      if (!uid) return;

      // 如果是静默更新（比如删歌触发的），我们就不显示 Loading 骨架屏，避免 UI 闪烁
      if (!isSilent) {
        setIsLoading(true);
      }
      setError(null);

      // 检查后端是否已就绪（仅在非静默且是首次加载时可能需要）
      const backendReady = await waitForBackend(getBackendBaseUrl(), 10000);

      if (!backendReady) {
        console.warn("后端服务未能在超时时间内就绪，尝试继续请求...");
        toast.warning(t("sidebar.toast.backendNotReady"));
      }

      Promise.all([getUserPlaylist(uid), getUserLikeLists(uid)])
        .then(([userPlaylistRes, likeListRes]) => {
          useUserStore.getState().setPlayList(userPlaylistRes.data.playlist);
          useUserStore.getState().setLikeListIDs(likeListRes.data.ids ?? []);
        })
        .catch((e) => {
          console.error("获取歌单或喜欢列表失败", e);
          // 静默更新失败可以不报强弹窗，只影响初始加载
          if (!isSilent) {
            setError(e instanceof Error ? e.message : t("sidebar.card.loadFailed"));
            toast.error(t("sidebar.toast.fetchFailed"));
          }
        })
        .finally(() => {
          if (!isSilent) {
            setIsLoading(false);
          }
        });
    },
    [isUserLogin],
  );

  const fetchFollowedArtists = React.useCallback(async () => {
    if (!isUserLogin) return;
    setArtistsLoading(true);
    setArtistsError(null);
    try {
      const res = await getFollowedArtists(12);
      const rawArtists = Array.isArray(res.data.data) ? res.data.data : [];
      const artists: FollowedArtist[] = rawArtists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        avatarUrl: artist.avatarUrl || artist.picUrl || artist.img1v1Url,
      }));
      useUserStore.getState().setFollowedArtists(artists);
    } catch (error) {
      console.error("Failed to load followed artists:", error);
      setArtistsError(t("sidebar.artist.fetchFailed"));
    } finally {
      setArtistsLoading(false);
    }
  }, [isUserLogin, t]);

  const handleLoginClick = () => {
    if (typeof window !== "undefined" && isElectron) window.electronAPI?.openLoginWindow();
    else smartRouter.replace("/login");
  };

  // 依赖监听：不仅监听登录状态，还监听 libraryUpdateTrigger
  const userId = useUserStore((s) => s.user?.userId);
  useEffect(() => {
    if (isUserLogin && userId && userId !== 0) {
      // 如果 trigger > 0 说明是人为触发的更新，启用静默模式(true)
      fetchPlaylist(libraryUpdateTrigger > 0);
      void fetchFollowedArtists();
    }
  }, [
    isUserLogin,
    userId,
    libraryUpdateTrigger, // 如果 trigger > 0 说明是人为触发的更新，启用静默模式(true)
    fetchPlaylist,
    fetchFollowedArtists,
  ]); // 增加了 trigger 依赖

  const createdPlaylists = playlists.filter((item) => item && item.creator.nickname === userName);
  const subscribedPlaylists = playlists.filter(
    (item) => item && item.creator.nickname !== userName,
  );

  const renderPlaylistItems = (items: typeof playlists) =>
    items.map((item) => (
      <LibraryItem
        key={item.id}
        id={item.id}
        title={item.name}
        subtitle={
          !item.subscribed
            ? t("sidebar.playlist.byCreator", { name: userName || t("sidebar.playlist.you") })
            : t("sidebar.playlist.byCreator", {
                name: item.creator?.nickname || t("common.meta.unknownUser"),
              })
        }
        coverImg={`${item.coverImgUrl}?param=100y100`}
        isCollapsed={isVeryNarrow}
      />
    ));

  const renderArtistItems = (items: FollowedArtist[]) =>
    items.map((artist) => (
      <button
        key={artist.id}
        type="button"
        onClick={() => smartRouter.push(`/artist?id=${artist.id}`)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-white/10",
          isVeryNarrow && "justify-center",
        )}
      >
        <Image
          width={40}
          height={40}
          src={`${artist.avatarUrl}?param=100y100`}
          alt={artist.name}
          className="size-10 shrink-0 rounded-full bg-[#242424] object-cover"
        />
        {!isVeryNarrow && (
          <span className="min-w-0 truncate text-sm font-medium text-zinc-200 group-hover:text-white">
            {artist.name}
          </span>
        )}
      </button>
    ));

  const renderArtistsLoading = () =>
    isVeryNarrow ? (
      <div className="flex flex-col items-center gap-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="size-10 animate-pulse rounded-full bg-[#242424]" />
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-1 px-1">
        {[1, 2, 3, 4].map((item) => (
          <SkeletonItem key={item} />
        ))}
      </div>
    );

  const renderFollowedArtistsSection = (
    options: { showEmptyState?: boolean; flat?: boolean } = {},
  ) => {
    const { showEmptyState = false, flat = false } = options;

    if (artistsLoading) {
      return renderArtistsLoading();
    }

    if (artistsError) {
      return isVeryNarrow ? (
        <div className="mt-4 flex flex-col items-center gap-2 text-zinc-500">
          <RefreshCw className="size-6" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-2">
          <ActionCard
            title={t("sidebar.artist.fetchFailed")}
            subtitle={artistsError}
            buttonText={t("common.action.retry")}
            onClick={() => void fetchFollowedArtists()}
          />
        </div>
      );
    }

    if (followedArtists.length === 0) {
      if (!showEmptyState) return null;

      return isVeryNarrow ? (
        <div className="mt-4 flex flex-col items-center gap-4 text-zinc-500">
          <User className="size-6" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-2">
          <ActionCard
            title={t("sidebar.artist.emptyTitle")}
            subtitle={t("sidebar.artist.emptySubtitle")}
            buttonText={t("common.action.reload")}
            onClick={() => void fetchFollowedArtists()}
          />
        </div>
      );
    }

    return isVeryNarrow || flat ? (
      renderArtistItems(followedArtists)
    ) : (
      <CollapsibleLibraryGroup title={t("sidebar.artist.followed")} defaultOpen>
        {renderArtistItems(followedArtists)}
      </CollapsibleLibraryGroup>
    );
  };

  const filterLabelMap = {
    ALL: t("sidebar.filter.all"),
    CREATED: t("sidebar.filter.created"),
    SUBSCRIBED: t("sidebar.filter.subscribed"),
    ARTISTS: t("sidebar.filter.artists"),
  } as const;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex size-full flex-col",
        !isVeryNarrow && "bg-momo-dark",
        isVeryNarrow ? "gap-3" : "gap-[6.5px]",
      )}
    >
      {/* 头部区域 */}
      <div className={cn("rounded-md bg-[#121212]", "flex flex-col gap-1")}>
        {/* Header 区 */}
        <div
          className={cn(
            "group/header flex shrink-0 items-center px-3 py-4 text-zinc-400",
            isVeryNarrow ? "justify-center" : "justify-between",
          )}
        >
          <button
            type="button"
            title="Scopify"
            onClick={() => smartRouter.push("/")}
            className={cn(
              "flex cursor-pointer items-center transition-colors hover:text-white",
              "gap-3 overflow-hidden font-semibold",
            )}
          >
            <FaCompactDisc
              className={cn("size-6 shrink-0 transition-transform", isVeryNarrow && "size-8")}
            />
            {!isVeryNarrow && <span className="min-w-0 truncate text-[15px]">Scopify</span>}
          </button>
          {!isVeryNarrow && (
            <div className="flex shrink-0 items-center text-zinc-400">
              <SiderBarMenuMemo />
            </div>
          )}
        </div>

        {/* 过滤区 */}
        {!isVeryNarrow ? (
          <div className="scrollbar-custom-h mb-2 flex shrink-0 gap-2 overflow-x-auto px-4">
            {(["ALL", "CREATED", "SUBSCRIBED", "ARTISTS"] as const).map((type, idx) => (
              <Button
                key={type}
                onClick={() => filterDispatch({ type })}
                className={cn(
                  "flex shrink-0 justify-center rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                  filterState === idx
                    ? "bg-white text-black"
                    : "bg-[#242424] text-white hover:bg-[#2a2a2a]",
                )}
              >
                {filterLabelMap[type]}
              </Button>
            ))}
          </div>
        ) : (
          <div className="mx-auto -mt-2 flex w-fit items-center justify-center rounded-sm p-1 text-zinc-400 transition-all hover:bg-[#2a2a2a] hover:text-white">
            <FilterMenu filterHook={{ state: filterState, dispatch: filterDispatch }} />
          </div>
        )}
      </div>

      {/* 曲库渲染区 */}
      <ScrollArea
        className={cn(
          "scrollbar-custom w-full flex-1",
          isVeryNarrow ? "px-0" : "px-2",
          "rounded-md bg-[#121212]",
        )}
      >
        <div className={cn("space-y-1", isVeryNarrow ? "pb-2" : "py-4")}>
          {/* ── 歌手筛选：独立视图 ── */}
          {filterState === 3 ? (
            !isUserLogin ? (
              isVeryNarrow ? (
                <div className="mt-4 flex flex-col items-center gap-4 text-zinc-500">
                  <button
                    type="button"
                    className={cn(
                      "rounded-md p-2 transition-all hover:bg-[#242424] hover:text-white",
                    )}
                    onClick={handleLoginClick}
                    title={t("login.required.followedArtists.title")}
                  >
                    <User className="size-6" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-2">
                  <ActionCard
                    title={t("login.required.followedArtists.title")}
                    subtitle={t("login.required.followedArtists.subtitle")}
                    buttonText={t("common.action.login")}
                    onClick={handleLoginClick}
                  />
                </div>
              )
            ) : (
              renderFollowedArtistsSection({ showEmptyState: true, flat: true })
            )
          ) : isLoading ? (
            /* ── 加载中：骨架屏 ── */
            isVeryNarrow ? (
              <div className="mt-4 flex flex-col items-center gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="size-10 animate-pulse rounded-md bg-[#242424]" />
                ))}
              </div>
            ) : (
              <div className="mt-1 flex flex-col gap-1 px-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonItem key={i} />
                ))}
              </div>
            )
          ) : error ? (
            isVeryNarrow ? (
              <div className="mt-4 flex flex-col items-center gap-2 text-zinc-500">
                <RefreshCw className="size-6" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title={t("sidebar.card.loadFailed")}
                  subtitle={error}
                  buttonText={t("common.action.retry")}
                  onClick={() => fetchPlaylist(false)}
                />
              </div>
            )
          ) : !isUserLogin ? (
            isVeryNarrow ? (
              <div className="mt-4 flex flex-col items-center gap-4 text-zinc-500">
                <button
                  type="button"
                  className={cn(
                    "rounded-md p-2 transition-all hover:bg-[#242424] hover:text-white",
                  )}
                  onClick={handleLoginClick}
                  title={t("sidebar.card.loginTitle")}
                >
                  <User className="size-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title={t("sidebar.card.loginTitle")}
                  subtitle={t("sidebar.card.loginSubtitle")}
                  buttonText={t("common.action.login")}
                  onClick={() => {
                    handleLoginClick();
                  }}
                />
              </div>
            )
          ) : /* ── 已登录但歌单为空 ── */
          playlists.length === 0 ? (
            isVeryNarrow ? (
              <div className="mt-4 flex flex-col items-center gap-4 text-zinc-500">
                <button
                  type="button"
                  onClick={() => fetchPlaylist(false)}
                  className="rounded-md p-2 transition-colors hover:bg-[#242424] hover:text-white"
                  title={t("common.action.reload")}
                >
                  <ListMusic className="size-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <ActionCard
                  title={t("sidebar.card.noPlaylistsTitle")}
                  subtitle={t("sidebar.card.noPlaylistsSubtitle")}
                  buttonText={t("common.action.reload")}
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
                  <CollapsibleLibraryGroup title={t("sidebar.group.created")} defaultOpen={true}>
                    {renderPlaylistItems(createdPlaylists)}
                  </CollapsibleLibraryGroup>
                ))}

              {/* 渲染收藏的歌单 (subscribed: true) */}
              {(filterState === 0 || filterState === 2) &&
                (isVeryNarrow ? (
                  renderPlaylistItems(subscribedPlaylists)
                ) : (
                  <CollapsibleLibraryGroup title={t("sidebar.group.subscribed")} defaultOpen={true}>
                    {renderPlaylistItems(subscribedPlaylists)}
                  </CollapsibleLibraryGroup>
                ))}

              {filterState === 0 && renderFollowedArtistsSection()}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export const Sidebar = React.memo(SidebarImpl);

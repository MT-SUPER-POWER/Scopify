"use client";

import { ListMusic, RefreshCw, User } from "lucide-react";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebarPlaylists } from "@/hooks/sidebar/useSidebarPlaylists";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { CollapsibleLibraryGroup } from "./CollapsibleLibraryGroup";
import { LibraryItem } from "./LibraryItem";
import { SidebarLibraryStateCard } from "./SidebarLibraryStateCard";

interface SidebarPlaylistLibraryProps {
  isCollapsed: boolean;
}

export function SidebarPlaylistLibrary({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const smartRouter = useSmartRouter();
  const playlists = useUserStore((state) => state.playlist);
  const userName = useUserStore((state) => state.user?.nickname);
  const { error, isLoading, reload } = useSidebarPlaylists();
  const createdPlaylists = playlists.filter((playlist) => playlist?.creator?.nickname === userName);
  const subscribedPlaylists = playlists.filter(
    (playlist) => playlist?.creator?.nickname !== userName,
  );

  const handleLogin = () => {
    if (!runtime.auth.openLoginWindow()) smartRouter.replace("/login");
  };

  const renderPlaylistItems = (items: typeof playlists) =>
    items.map((playlist) => (
      <LibraryItem
        key={playlist.id}
        id={playlist.id}
        title={playlist.name}
        subtitle={
          !playlist.subscribed
            ? t("sidebar.playlist.byCreator", { name: userName || t("sidebar.playlist.you") })
            : t("sidebar.playlist.byCreator", {
                name: playlist.creator?.nickname || t("common.meta.unknownUser"),
              })
        }
        coverImg={`${playlist.coverImgUrl}?param=100y100`}
        isCollapsed={isCollapsed}
      />
    ));

  const collapsedAction = (label: string, onClick: () => void, icon: React.ReactNode) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="mx-auto mt-4 flex rounded-md p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
    >
      {icon}
    </button>
  );

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <div className={cn("flex flex-col gap-2", isCollapsed ? "items-center" : "px-1")}>
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className={cn(
              "animate-pulse rounded-md bg-white/5",
              isCollapsed ? "size-10" : "h-14 w-full",
            )}
          />
        ))}
      </div>
    );
  } else if (error) {
    content = isCollapsed ? (
      collapsedAction(
        t("common.action.retry"),
        () => void reload(),
        <RefreshCw className="size-5" />,
      )
    ) : (
      <SidebarLibraryStateCard
        title={t("sidebar.card.loadFailed")}
        subtitle={error}
        actionLabel={t("common.action.retry")}
        onAction={() => void reload()}
      />
    );
  } else if (!isLoggedIn) {
    content = isCollapsed ? (
      collapsedAction(t("common.action.login"), handleLogin, <User className="size-5" />)
    ) : (
      <SidebarLibraryStateCard
        title={t("sidebar.card.loginTitle")}
        subtitle={t("sidebar.card.loginSubtitle")}
        actionLabel={t("common.action.login")}
        onAction={handleLogin}
      />
    );
  } else if (playlists.length === 0) {
    content = isCollapsed ? (
      collapsedAction(
        t("common.action.reload"),
        () => void reload(),
        <ListMusic className="size-5" />,
      )
    ) : (
      <SidebarLibraryStateCard
        title={t("sidebar.card.noPlaylistsTitle")}
        subtitle={t("sidebar.card.noPlaylistsSubtitle")}
        actionLabel={t("common.action.reload")}
        onAction={() => void reload()}
      />
    );
  } else if (isCollapsed) {
    content = (
      <>
        {renderPlaylistItems(createdPlaylists)}
        {renderPlaylistItems(subscribedPlaylists)}
      </>
    );
  } else {
    content = (
      <>
        <CollapsibleLibraryGroup title={t("sidebar.group.created")} defaultOpen>
          {renderPlaylistItems(createdPlaylists)}
        </CollapsibleLibraryGroup>
        <CollapsibleLibraryGroup title={t("sidebar.group.subscribed")} defaultOpen>
          {renderPlaylistItems(subscribedPlaylists)}
        </CollapsibleLibraryGroup>
      </>
    );
  }

  return (
    <section
      className={cn("flex min-h-0 flex-1 flex-col", !isCollapsed && "border-t border-white/5")}
      aria-label={t("sidebar.group.playlists")}
    >
      {!isCollapsed && (
        <p className="shrink-0 px-5 pt-4 pb-2 text-xs font-bold text-zinc-500">
          {t("sidebar.group.playlists")}
        </p>
      )}
      <ScrollArea
        className="scrollbar-custom min-h-0 flex-1 px-2"
        viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
      >
        <div className={cn("w-full min-w-0 space-y-1", isCollapsed ? "pb-2" : "pb-4")}>
          {content}
        </div>
      </ScrollArea>
    </section>
  );
}

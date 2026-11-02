"use client";

import { ListMusic, LogIn, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useSidebarPlaylists } from "@/hooks/sidebar/useSidebarPlaylists";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useTranslation } from "react-i18next";
import type { SidebarPlaylistLibraryContentProps } from "@/types/sidebar/components";
import { SidebarPlaylistSkeleton } from "./SidebarPlaylistSkeleton";
import { SidebarSortablePlaylists } from "./SidebarSortablePlaylists";
import { SidebarLibraryStateCard } from "./SidebarLibraryStateCard";

export function SidebarPlaylistLibraryContent({
  isCollapsed,
  onLogin,
  onCreate,
}: SidebarPlaylistLibraryContentProps) {
  const { t } = useTranslation();
  const isLoggedIn = useLoginStatus();
  const { error, isLoading, isPaused, playlists, reload, refreshError, isFetching } =
    useSidebarPlaylists();

  if (!isLoggedIn) {
    return (
      <SidebarLibraryStateCard
        isCollapsed={isCollapsed}
        icon={LogIn}
        title={t("sidebar.card.loginTitle")}
        subtitle={t("sidebar.card.loginSubtitle")}
        actionLabel={t("common.action.login")}
        onAction={onLogin}
      />
    );
  }
  if (error) throw error;
  if (isPaused) {
    return (
      <SidebarLibraryStateCard
        isCollapsed={isCollapsed}
        icon={WifiOff}
        title={t("sidebar.card.waitingForNetwork")}
        subtitle={t("sidebar.card.reconnectHint")}
      />
    );
  }
  if (isLoading || playlists === undefined) {
    return (
      <div role="status" aria-label={t("sidebar.card.loading")}>
        <SidebarPlaylistSkeleton isCollapsed={isCollapsed} />
      </div>
    );
  }

  return (
    <>
      {(refreshError || isFetching) && (
        <div
          role="status"
          className="flex items-center justify-center gap-1 px-2 py-1 text-xs text-content-muted"
        >
          {isFetching ? (
            <>
              <RefreshCw aria-hidden className="size-3.5 shrink-0 animate-spin" />
              {!isCollapsed && t("sidebar.card.refreshing")}
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              title={t("sidebar.card.refreshFailed")}
              aria-label={t("sidebar.card.refreshFailed")}
              onClick={() => void reload()}
              className="h-auto min-w-0 gap-1 p-1 text-xs"
            >
              <RefreshCw aria-hidden className="size-3.5 shrink-0" />
              {!isCollapsed && t("sidebar.card.refreshFailed")}
            </Button>
          )}
        </div>
      )}
      {playlists.length === 0 ? (
        <SidebarLibraryStateCard
          isCollapsed={isCollapsed}
          icon={ListMusic}
          title={t("sidebar.card.noPlaylistsTitle")}
          subtitle={t("sidebar.card.noPlaylistsSubtitle")}
          actionLabel={t("sidebar.menu.createPlaylist")}
          onAction={onCreate}
        />
      ) : (
        <SidebarSortablePlaylists playlists={playlists} isCollapsed={isCollapsed} />
      )}
    </>
  );
}

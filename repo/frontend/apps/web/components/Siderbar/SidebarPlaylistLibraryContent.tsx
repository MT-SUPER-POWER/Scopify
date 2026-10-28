"use client";

import { ListMusic, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useSidebarPlaylists } from "@/hooks/sidebar/useSidebarPlaylists";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useI18n } from "@/store/module/i18n";
import { QueryPending } from "@/components/shared/QueryPending";
import type { SidebarPlaylistLibraryProps } from "@/types/sidebar/components";
import { SidebarPlaylistSkeleton } from "./SidebarPlaylistSkeleton";
import { SidebarSortablePlaylists } from "./SidebarSortablePlaylists";
import { SidebarLibraryStateCard } from "./SidebarLibraryStateCard";

export function SidebarPlaylistLibraryContent({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const { error, isLoading, isPaused, playlists, reload } = useSidebarPlaylists();
  const collapsedAction = (label: string, onClick: () => void, icon: ReactNode) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="mx-auto mt-4 flex rounded-md p-2 text-content-muted transition-colors hover:bg-content/10 hover:text-content"
    >
      {icon}
    </button>
  );
  // Logged out: show nothing rather than nagging; login lives in the header profile menu.
  if (!isLoggedIn) return null;
  if (isPaused) return <QueryPending isPaused />;
  if (isLoading) return <SidebarPlaylistSkeleton isCollapsed={isCollapsed} />;
  if (error)
    return isCollapsed ? (
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
  if (playlists.length === 0)
    return isCollapsed ? (
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
  return <SidebarSortablePlaylists playlists={playlists} isCollapsed={isCollapsed} />;
}

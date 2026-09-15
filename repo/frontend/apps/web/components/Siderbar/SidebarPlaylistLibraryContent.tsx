"use client";

import { ListMusic, RefreshCw, User } from "lucide-react";
import type { ReactNode } from "react";
import { useSidebarPlaylists } from "@/hooks/sidebar/useSidebarPlaylists";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";
import { SidebarSortablePlaylists } from "./SidebarSortablePlaylists";
import { SidebarLibraryStateCard } from "./SidebarLibraryStateCard";

export function SidebarPlaylistLibraryContent({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const smartRouter = useSmartRouter();
  const { error, isLoading, playlists, reload } = useSidebarPlaylists();
  const handleLogin = () => {
    if (!runtime.auth.openLoginWindow()) smartRouter.replace("/login");
  };
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
  if (isLoading)
    return (
      <div className={cn("flex flex-col gap-2", isCollapsed ? "items-center" : "px-1")}>
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className={cn(
              "animate-pulse rounded-md bg-skeleton",
              isCollapsed ? "size-10" : "h-14 w-full",
            )}
          />
        ))}
      </div>
    );
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
  if (!isLoggedIn)
    return isCollapsed ? (
      collapsedAction(t("common.action.login"), handleLogin, <User className="size-5" />)
    ) : (
      <SidebarLibraryStateCard
        title={t("sidebar.card.loginTitle")}
        subtitle={t("sidebar.card.loginSubtitle")}
        actionLabel={t("common.action.login")}
        onAction={handleLogin}
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

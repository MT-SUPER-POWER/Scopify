"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreatePlaylistFromTracksDialog } from "@/components/shared/CreatePlaylistFromTracksDialog";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { runtime } from "@/lib/runtime";
import { openLoginWindowOrFallback } from "@/lib/runtime/login";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { SidebarPlaylistLibraryProps } from "@/types/sidebar/components";
import { SidebarSpecialPlaylists } from "./SidebarSpecialPlaylists";
import { SidebarPlaylistLibraryContent } from "./SidebarPlaylistLibraryContent";
import { SidebarPlaylistFailure } from "./SidebarPlaylistFailure";
import { SidebarPlaylistSkeleton } from "./SidebarPlaylistSkeleton";
import { SidebarProviderLibrary } from "./SidebarProviderLibrary";

export function SidebarPlaylistLibrary({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useTranslation();
  const { account, provider } = useLibraryAccount();
  const requireLoginAction = useRequireLoginAction();
  const smartRouter = useSmartRouter();
  const canManage = useProviderCapability("playlist.manage");
  // Ordering and dropping tracks on playlists are NetEase's; other platforms get a plain list.
  const hasOrderedLibrary = useProviderCapability("playlist.reorder");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createPlaylist = () => void requireLoginAction(() => setIsCreateOpen(true));
  const openLogin = () => {
    openLoginWindowOrFallback(runtime.auth, () => smartRouter.push("/login"));
  };
  return (
    <section
      className={cn("flex flex-col", !isCollapsed && "border-t border-content/10")}
      aria-label={t("sidebar.group.playlists")}
    >
      {!isCollapsed && (
        <div className="px-3 pt-3">
          <div className="flex h-6 items-center justify-between gap-2 pb-2 pl-2">
            <p className="text-xs font-medium text-content-subtle">
              {t("sidebar.group.playlists")}
            </p>
            {canManage && (
              <button
                type="button"
                title={t("sidebar.menu.createPlaylist")}
                aria-label={t("sidebar.menu.createPlaylist")}
                onClick={createPlaylist}
                className="-my-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-content/10 hover:text-content"
              >
                <Plus className="size-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}
      <div className={cn("w-full min-w-0 space-y-1 px-2 pt-1", isCollapsed ? "pb-2" : "pb-4")}>
        <QueryBoundary
          resetKey={`sidebar-playlists:${provider.provider}:${account?.accountId ?? "anonymous"}`}
          compact
          renderFailure={(props) => <SidebarPlaylistFailure {...props} isCollapsed={isCollapsed} />}
          renderWaiting={() => <SidebarPlaylistSkeleton isCollapsed={isCollapsed} />}
        >
          {hasOrderedLibrary ? (
            <>
              {account && <SidebarSpecialPlaylists isCollapsed={isCollapsed} />}
              <SidebarPlaylistLibraryContent
                isCollapsed={isCollapsed}
                onLogin={openLogin}
                onCreate={createPlaylist}
              />
            </>
          ) : (
            <SidebarProviderLibrary
              isCollapsed={isCollapsed}
              onLogin={openLogin}
              onCreate={createPlaylist}
            />
          )}
        </QueryBoundary>
      </div>
      <CreatePlaylistFromTracksDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        tracks={[]}
      />
    </section>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreatePlaylistFromTracksDialog } from "@/components/shared/CreatePlaylistFromTracksDialog";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { SidebarPlaylistLibraryProps } from "@/types/sidebar/components";
import { SidebarSpecialPlaylists } from "./SidebarSpecialPlaylists";
import { SidebarPlaylistLibraryContent } from "./SidebarPlaylistLibraryContent";

export function SidebarPlaylistLibrary({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useTranslation();
  const isLoggedIn = useLoginStatus();
  const requireLoginAction = useRequireLoginAction();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
            <button
              type="button"
              title={t("sidebar.menu.createPlaylist")}
              aria-label={t("sidebar.menu.createPlaylist")}
              onClick={() => void requireLoginAction(() => setIsCreateOpen(true))}
              className="-my-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-content/10 hover:text-content"
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
      <div className={cn("w-full min-w-0 space-y-1 px-2 pt-1", isCollapsed ? "pb-2" : "pb-4")}>
        {isLoggedIn && <SidebarSpecialPlaylists isCollapsed={isCollapsed} />}
        <SidebarPlaylistLibraryContent isCollapsed={isCollapsed} />
      </div>
      <CreatePlaylistFromTracksDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        tracks={[]}
      />
    </section>
  );
}

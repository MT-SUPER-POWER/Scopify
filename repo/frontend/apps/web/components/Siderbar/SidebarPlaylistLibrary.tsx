"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreatePlaylistFromTracksDialog } from "@/components/shared/CreatePlaylistFromTracksDialog";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";
import { SidebarSpecialPlaylists } from "./SidebarSpecialPlaylists";
import { SidebarPlaylistLibraryContent } from "./SidebarPlaylistLibraryContent";

export function SidebarPlaylistLibrary({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const requireLoginAction = useRequireLoginAction();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  return (
    <section
      className={cn("flex flex-col", !isCollapsed && "border-t border-content/10")}
      aria-label={t("sidebar.group.playlists")}
    >
      {!isCollapsed && (
        <div className="flex items-center justify-between pt-4 pr-3 pb-2 pl-5 text-xs font-bold text-content-subtle">
          <span>{t("sidebar.group.playlists")}</span>
          <button
            type="button"
            title={t("sidebar.menu.createPlaylist")}
            aria-label={t("sidebar.menu.createPlaylist")}
            onClick={() => void requireLoginAction(() => setIsCreateOpen(true))}
            className="-my-0.5 flex size-5 items-center justify-center rounded-full transition-colors hover:bg-content/10 hover:text-content"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
      <div className={cn("w-full min-w-0 space-y-1 px-2", isCollapsed ? "pb-2" : "pb-4")}>
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

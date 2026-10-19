"use client";

import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";
import { SidebarSpecialPlaylists } from "./SidebarSpecialPlaylists";
import { SidebarPlaylistLibraryContent } from "./SidebarPlaylistLibraryContent";

export function SidebarPlaylistLibrary({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  return (
    <section
      className={cn("flex flex-col", !isCollapsed && "border-t border-content/10")}
      aria-label={t("sidebar.group.playlists")}
    >
      {!isCollapsed && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2 text-xs font-bold text-content-subtle">
          <span>{t("sidebar.group.playlists")}</span>
        </div>
      )}
      <div className={cn("w-full min-w-0 space-y-1 px-2", isCollapsed ? "pb-2" : "pb-4")}>
        {isLoggedIn && <SidebarSpecialPlaylists isCollapsed={isCollapsed} />}
        <SidebarPlaylistLibraryContent isCollapsed={isCollapsed} />
      </div>
    </section>
  );
}

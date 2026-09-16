"use client";

import { useSidebarPlaylistDrop } from "@/hooks/playlist/useSidebarPlaylistDrop";
import { useI18n } from "@/store/module/i18n";
import type { SidebarLikedPlaylistItemProps } from "@/types/components/sidebar";
import { LibraryItem } from "./LibraryItem";

export function SidebarLikedPlaylistItem({ playlist, isCollapsed }: SidebarLikedPlaylistItemProps) {
  const { t } = useI18n();
  const drop = useSidebarPlaylistDrop(playlist);
  return (
    <div {...drop.props} className="group relative rounded-md">
      <LibraryItem
        id={playlist.id}
        href="/liked"
        coverImg={`${playlist.coverImgUrl}?param=100y100`}
        title={t("sidebar.library.likedMusic")}
        subtitle={t("sidebar.playlist.you")}
        isCollapsed={isCollapsed}
      />
    </div>
  );
}

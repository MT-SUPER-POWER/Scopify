"use client";

import { useSidebarPlaylistDrop } from "@/hooks/playlist/useSidebarPlaylistDrop";
import { useTranslation } from "react-i18next";

import type { SidebarLikedPlaylistItemProps } from "@/types/sidebar/components";
import { LibraryItem } from "./LibraryItem";

export function SidebarLikedPlaylistItem({ playlist, isCollapsed }: SidebarLikedPlaylistItemProps) {
  const { t } = useTranslation();
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

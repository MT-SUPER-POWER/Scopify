"use client";

import { useSidebarPlaylists } from "@/hooks/sidebar/useSidebarPlaylists";
import { useTranslation } from "react-i18next";

import type { SidebarPlaylistLibraryProps } from "@/types/sidebar/components";
import { CollapsibleLibraryGroup } from "./CollapsibleLibraryGroup";
import { PersonalFmPlaylistItem } from "./PersonalFmPlaylistItem";
import { SidebarLikedPlaylistItem } from "./SidebarLikedPlaylistItem";

export function SidebarSpecialPlaylists({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useTranslation();
  const { playlists } = useSidebarPlaylists();
  const likedPlaylist = playlists.find((playlist) => playlist.specialType === 5);
  const items = (
    <>
      <PersonalFmPlaylistItem isCollapsed={isCollapsed} />
      {likedPlaylist && (
        <SidebarLikedPlaylistItem playlist={likedPlaylist} isCollapsed={isCollapsed} />
      )}
    </>
  );

  return isCollapsed ? (
    items
  ) : (
    <CollapsibleLibraryGroup title={t("sidebar.group.personal")}>{items}</CollapsibleLibraryGroup>
  );
}

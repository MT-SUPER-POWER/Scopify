"use client";

import { usePathname } from "next/navigation";

import {
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  PERSONAL_FM_ROUTE,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
  isPersonalFmRoute,
} from "@/constants/personalFm";
import { startPersonalFmStreamOnEntry } from "@/hooks/personalFm/usePersonalFmPlaylist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useI18n } from "@/store/module/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import { LibraryItem } from "./LibraryItem";

import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";

export function PersonalFmPlaylistItem({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useI18n();
  const playlistId = usePlayerStore((state) => state.playlistId);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const selection = usePersonalFmStore((state) => state.selection);
  const isPersonalFm = isPersonalFmPlaybackSource(playlistId);
  const isLoggedIn = useLoginStatus();
  const pathname = usePathname();

  // Request songs while the route is still loading instead of waiting for the page to mount.
  const handleClick = () => {
    if (!isLoggedIn || isPersonalFmRoute(pathname)) return;
    void startPersonalFmStreamOnEntry();
  };

  return (
    <LibraryItem
      coverImg={
        isPersonalFm && currentSong?.al.picUrl ? currentSong.al.picUrl : "/personal-fm-cover.svg"
      }
      hasContextMenu={false}
      href={PERSONAL_FM_ROUTE}
      id={PERSONAL_FM_PLAYBACK_SOURCE_ID}
      isCollapsed={isCollapsed}
      onClick={handleClick}
      subtitle={getPersonalFmSelectionLabel(selection, t)}
      title={t("personalFm.title")}
    />
  );
}

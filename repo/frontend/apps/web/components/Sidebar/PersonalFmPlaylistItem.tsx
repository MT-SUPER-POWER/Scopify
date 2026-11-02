"use client";

import {
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  PERSONAL_FM_ROUTE,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
} from "@/constants/personalFm";
import { usePersonalFmEntry } from "@/hooks/personalFm/usePersonalFmEntry";
import { useTranslation } from "react-i18next";

import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import { LibraryItem } from "./LibraryItem";

import type { SidebarPlaylistLibraryProps } from "@/types/sidebar/components";

export function PersonalFmPlaylistItem({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useTranslation();
  const playlistId = usePlayerStore((state) => state.playlistId);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const selection = usePersonalFmStore((state) => state.selection);
  const isLoading = usePersonalFmStore((state) => state.status === "loading");
  const isPersonalFm = isPersonalFmPlaybackSource(playlistId);
  const handleClick = usePersonalFmEntry();

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
      subtitle={
        isLoading ? t("personalFm.status.loading") : getPersonalFmSelectionLabel(selection, t)
      }
      title={t("personalFm.title")}
    />
  );
}

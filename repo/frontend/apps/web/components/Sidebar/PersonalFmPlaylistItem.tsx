"use client";

import {
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  PERSONAL_FM_ROUTE,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
} from "@/constants/personalFm";
import { usePersonalFmEntry } from "@/hooks/personalFm/usePersonalFmEntry";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { useTranslation } from "react-i18next";

import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import { LibraryItem } from "./LibraryItem";

import type { SidebarPlaylistLibraryProps } from "@/types/sidebar/components";

export function PersonalFmPlaylistItem({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useTranslation();
  const playlistId = usePlayerStore((state) => state.playlistId);
  const currentSong = usePlayerStore((state) => state.currentTrack);
  const selection = usePersonalFmStore((state) => state.selection);
  const isLoading = usePersonalFmStore((state) => state.status === "loading");
  const isPersonalFm = isPersonalFmPlaybackSource(playlistId);
  const handleClick = usePersonalFmEntry();
  const hasFm = useProviderCapability("recommend.fm");
  const hasModes = useProviderCapability("recommend.fm.modes");

  // The platform has no FM: no sidebar item, no requests.
  if (!hasFm) return null;

  return (
    <LibraryItem
      coverImg={(isPersonalFm && currentSong?.album?.coverUrl) || "/personal-fm-cover.svg"}
      hasContextMenu={false}
      href={PERSONAL_FM_ROUTE}
      id={PERSONAL_FM_PLAYBACK_SOURCE_ID}
      isCollapsed={isCollapsed}
      onClick={handleClick}
      subtitle={
        isLoading
          ? t("personalFm.status.loading")
          : hasModes
            ? getPersonalFmSelectionLabel(selection, t)
            : ""
      }
      title={t("personalFm.title")}
    />
  );
}

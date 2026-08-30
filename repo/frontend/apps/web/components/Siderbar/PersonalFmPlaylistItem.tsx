"use client";

import {
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
} from "@/constants/personalFm";
import { useI18n } from "@/store/module/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import { LibraryItem } from "./LibraryItem";

interface PersonalFmPlaylistItemProps {
  isCollapsed: boolean;
}

export function PersonalFmPlaylistItem({ isCollapsed }: PersonalFmPlaylistItemProps) {
  const { t } = useI18n();
  const playlistId = usePlayerStore((state) => state.playlistId);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const selection = usePersonalFmStore((state) => state.selection);
  const isPersonalFm = isPersonalFmPlaybackSource(playlistId);

  return (
    <LibraryItem
      coverImg={
        isPersonalFm && currentSong?.al.picUrl ? currentSong.al.picUrl : "/personal-fm-cover.svg"
      }
      hasContextMenu={false}
      href="/personal-fm"
      id={PERSONAL_FM_PLAYBACK_SOURCE_ID}
      isCollapsed={isCollapsed}
      subtitle={getPersonalFmSelectionLabel(selection, t)}
      title={t("personalFm.title")}
    />
  );
}

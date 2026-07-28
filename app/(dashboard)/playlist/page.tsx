"use client";

import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useI18n } from "@/store/module/i18n";

export default function PlaylistPage() {
  const { t } = useI18n();
  const playlist = usePlaylist();

  if (!playlist.playlistId && !playlist.isDailyRecommend)
    return <div className="p-8 text-white">{t("playlist.page.invalidUrl")}</div>;

  return <PlaylistContent {...playlist} />;
}

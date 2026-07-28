"use client";

import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { useRadioData } from "@/hooks/radio/useRadioData";
import { useI18n } from "@/store/module/i18n";

export default function RadioPage() {
  const { t } = useI18n();
  const radio = useRadioData();

  if (!radio.radioId) return <div className="p-8 text-white">{t("playlist.page.invalidUrl")}</div>;

  return (
    <PlaylistContent
      dailyDate={null}
      hideAlbumColumn
      isDailyRecommend={false}
      isLoading={radio.isLoading}
      playlistId={null}
      playlistInfo={radio.playlistInfo}
      playSourceId={`radio:${radio.radioId}`}
      readonly
      refetchTracks={radio.refetchTracks}
      themeColor={radio.themeColor}
      tracks={radio.tracks}
    />
  );
}

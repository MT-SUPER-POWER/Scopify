"use client";

import { DailyRecommendationSwitch } from "@/components/Playlist/DailyRecommendationSwitch";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useI18n } from "@/store/module/i18n";

export function PlaylistDetail() {
  const { locale, t } = useI18n();
  const playlist = usePlaylist();
  const router = useSmartRouter();
  const categoryLabel =
    locale === "en-US" ? "Style recommendations" : locale === "zh-TW" ? "風格推薦" : "风格推荐";
  const categoryUrl = playlist.dailyDate
    ? `/playlist/?dailyCategory=true&dailyDate=${encodeURIComponent(playlist.dailyDate)}`
    : "/playlist/?dailyCategory=true";

  if (!playlist.playlistId && !playlist.isDailyRecommend)
    return <div className="p-8 text-content">{t("playlist.page.invalidUrl")}</div>;

  return (
    <PlaylistContent
      {...playlist}
      trailingActionSlot={
        playlist.isDailyRecommend ? (
          <DailyRecommendationSwitch
            label={categoryLabel}
            onClick={() => router.push(categoryUrl)}
          />
        ) : undefined
      }
      commentResourceId={playlist.playlistId}
      commentResourceKind="playlist"
    />
  );
}

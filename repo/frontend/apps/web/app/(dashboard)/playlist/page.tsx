"use client";

import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useI18n } from "@/store/module/i18n";
import { useSearchParams } from "next/navigation";
import { DailyCategoryPage } from "@/components/Playlist/DailyCategoryPage";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { DailyRecommendationSwitch } from "@/components/Playlist/DailyRecommendationSwitch";

export default function PlaylistPage() {
  const params = useSearchParams();
  if (params.get("dailyCategory") === "true") return <DailyCategoryPage />;
  return <RegularPlaylistPage />;
}

function RegularPlaylistPage() {
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

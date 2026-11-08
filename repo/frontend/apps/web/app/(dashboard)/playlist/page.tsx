"use client";

import { useSearchParams } from "next/navigation";
import { DailyCategoryPage } from "@/components/Playlist/DailyCategoryPage";
import { CapabilityGate } from "@/components/provider/CapabilityGate";
import { UnsupportedPlatformState } from "@/components/provider/UnsupportedPlatformState";
import { DailyRecommendationSwitch } from "@/components/Playlist/DailyRecommendationSwitch";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";

// 独立组件：usePlaylist 不能放在 dailyCategory 提前返回之后
function PlaylistDetail() {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const playlist = usePlaylist();
  const router = useSmartRouter();
  const canReadComments = useProviderCapability("comments.read");
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
      commentResourceId={canReadComments ? playlist.playlistId : null}
      commentResourceKind="playlist"
    />
  );
}

export default function PlaylistPage() {
  const params = useSearchParams();
  const isDailyCategory = params.get("dailyCategory") === "true";
  const page = isDailyCategory ? <DailyCategoryPage /> : <PlaylistDetail />;
  if (!isDailyCategory && params.get("isDailyRecommend") !== "true") return page;
  // Daily recommendations reuse this page, but they are a recommendation list, not a playlist.
  return (
    <CapabilityGate requires="recommend.daily" fallback={<UnsupportedPlatformState />}>
      {page}
    </CapabilityGate>
  );
}

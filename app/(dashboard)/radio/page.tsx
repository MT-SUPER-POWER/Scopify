"use client";

import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { RadioTracklistTable } from "@/components/radio/RadioTracklistTable";
import { CollectionToggleButton } from "@/components/shared/CollectionToggleButton";
import { useRadioData } from "@/hooks/radio/useRadioData";
import { useRadioFavorite } from "@/hooks/radio/useRadioFavorite";
import { useI18n } from "@/store/module/i18n";

export default function RadioPage() {
  const { t } = useI18n();
  const radio = useRadioData();
  const { isFavorited, isFavoriting, toggleFavorite } = useRadioFavorite(radio.isSubscribed);
  const radioId = radio.radioId;

  if (!radioId) return <div className="p-8 text-white">{t("playlist.page.invalidUrl")}</div>;

  return (
    <PlaylistContent
      actionSlot={
        <CollectionToggleButton
          isCollected={isFavorited}
          isLoading={radio.isSubscriptionLoading || isFavoriting}
          onToggle={() => void toggleFavorite(radioId)}
          subscribeLabel={t("library.podcasts.action.favorite")}
          unsubscribeLabel={t("library.podcasts.action.unfavorite")}
        />
      }
      contentSlot={({ searchQuery }) => (
        <RadioTracklistTable
          programs={radio.programs}
          radioId={radioId}
          searchQuery={searchQuery}
          tracks={radio.tracks}
        />
      )}
      dailyDate={null}
      isDailyRecommend={false}
      isLoading={radio.isLoading}
      playlistId={null}
      playlistInfo={radio.playlistInfo}
      playSourceId={`radio:${radioId}`}
      readonly
      refetchTracks={radio.refetchTracks}
      themeColor={radio.themeColor}
      tracks={radio.tracks}
    />
  );
}

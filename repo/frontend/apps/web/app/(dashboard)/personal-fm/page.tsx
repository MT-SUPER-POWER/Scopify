"use client";

import { Radio } from "lucide-react";
import { LibraryStatePage } from "@/components/library/LibraryStatePage";
import { PersonalFmControlPanel } from "@/components/player/PersonalFmControlPanel";
import { PersonalFmRefreshButton } from "@/components/player/PersonalFmRefreshButton";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { QuietState } from "@/components/shared/QuietState";
import { usePersonalFmPlaylist } from "@/hooks/personalFm/usePersonalFmPlaylist";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useTranslation } from "react-i18next";

export default function PersonalFmPage() {
  const isLoggedIn = useLoginStatus();
  const { t } = useTranslation();
  const personalFm = usePersonalFmPlaylist();

  if (!isLoggedIn) {
    return (
      <LibraryStatePage>
        <QuietState icon={Radio} title={t("personalFm.loggedOut")} />
      </LibraryStatePage>
    );
  }

  return (
    <PlaylistContent
      {...personalFm}
      actionSlot={<PersonalFmControlPanel placement="playlist" />}
      trailingActionSlot={
        <PersonalFmRefreshButton
          isRefreshing={personalFm.isRefreshing}
          onRefresh={personalFm.refetchTracks}
        />
      }
      dailyDate={null}
      isDailyRecommend={false}
      playlistId={null}
      onDislikePersonalFm={personalFm.onDislikeTrack}
      readonly
      showShuffle={false}
    />
  );
}

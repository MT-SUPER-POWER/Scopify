"use client";

import { Radio } from "lucide-react";
import { PersonalFmControlPanel } from "@/components/player/PersonalFmControlPanel";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { QuietState } from "@/components/shared/QuietState";
import { usePersonalFmPlaylist } from "@/hooks/personalFm/usePersonalFmPlaylist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useI18n } from "@/store/module/i18n";

export default function PersonalFmPage() {
  const isLoggedIn = useLoginStatus();
  const { t } = useI18n();
  const personalFm = usePersonalFmPlaylist();

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-surface-raised px-6 pt-24 pb-28 md:px-10">
        <QuietState icon={Radio} title={t("personalFm.loggedOut")} />
      </main>
    );
  }

  return (
    <PlaylistContent
      {...personalFm}
      actionSlot={<PersonalFmControlPanel placement="playlist" />}
      dailyDate={null}
      isDailyRecommend={false}
      playlistId={null}
      onDislikePersonalFm={personalFm.onDislikeTrack}
      readonly
      showShuffle={false}
    />
  );
}

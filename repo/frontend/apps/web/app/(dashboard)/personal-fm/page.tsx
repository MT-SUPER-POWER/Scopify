"use client";

import { PersonalFmControlPanel } from "@/components/player/PersonalFmControlPanel";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { usePersonalFmPlaylist } from "@/hooks/personalFm/usePersonalFmPlaylist";

export default function PersonalFmPage() {
  const personalFm = usePersonalFmPlaylist();

  return (
    <PlaylistContent
      {...personalFm}
      actionSlot={<PersonalFmControlPanel placement="playlist" />}
      dailyDate={null}
      isDailyRecommend={false}
      playlistId={null}
      readonly
      showShuffle={false}
    />
  );
}

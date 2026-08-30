"use client";

import { PersonalFmControlPanel } from "@/components/player/PersonalFmControlPanel";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { usePersonalFmPlaylist } from "@/hooks/personalFm/usePersonalFmPlaylist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";

export default function PersonalFmPage() {
  const isLoggedIn = useLoginStatus();
  const router = useSmartRouter();
  const personalFm = usePersonalFmPlaylist();

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-surface-raised px-6 pt-24 pb-28 md:px-10">
        <LoginRequiredPrompt reason="library" onLogin={() => router.push("/login")} />
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
      readonly
      showShuffle={false}
    />
  );
}

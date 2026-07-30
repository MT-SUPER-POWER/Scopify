"use client";

import { SubscribedPodcastCard } from "@/components/library/SubscribedPodcastCard";
import { usePodcastPlay } from "@/hooks/library/usePodcastPlay";
import { usePlayerStore } from "@/store";
import type { SubscribedPodcastGridProps } from "@/types/components/library";

export function SubscribedPodcastGrid({ podcasts }: SubscribedPodcastGridProps) {
  const { handlePlayPodcast, loadingPodcastId } = usePodcastPlay();
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {podcasts.map((podcast) => {
        const isActive =
          currentSongDetail?.al?.id === podcast.id ||
          String(playlistId) === `radio:${podcast.id}` ||
          String(playlistId) === String(podcast.id);

        return (
          <SubscribedPodcastCard
            key={podcast.id}
            podcast={podcast}
            isActive={isActive}
            isLoading={loadingPodcastId === podcast.id}
            isPlaying={isPlaying}
            onPause={() => setIsPlaying(false)}
            onPlay={() => void handlePlayPodcast(podcast.id)}
          />
        );
      })}
    </div>
  );
}

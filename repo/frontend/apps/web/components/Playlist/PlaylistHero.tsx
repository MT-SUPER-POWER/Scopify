import PlaylistHeader from "@/components/Playlist/Header";
import PlaylistHeaderSkeleton from "@/components/Playlist/HeaderSkeleton";
import type { PlaylistHeroProps } from "@/types/components/playlist";

export function PlaylistHero({
  isLoading,
  themeColor,
  playlistInfo,
  isDailyRecommend,
}: PlaylistHeroProps) {
  return (
    <>
      {!isLoading && themeColor ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 opacity-60 md:h-125"
          style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
        />
      ) : null}
      <div data-track-drag-chrome>
        {playlistInfo ? (
          <PlaylistHeader info={playlistInfo} isDaily={isDailyRecommend} />
        ) : (
          <PlaylistHeaderSkeleton showActions={isLoading} />
        )}
      </div>
    </>
  );
}

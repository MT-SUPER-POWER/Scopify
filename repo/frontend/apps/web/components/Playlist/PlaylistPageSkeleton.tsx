import PlaylistHeaderSkeleton from "@/components/Playlist/HeaderSkeleton";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";

export function PlaylistPageSkeleton() {
  return (
    <div className="bg-surface-raised relative flex min-h-full w-full flex-col font-sans">
      <div className="hero-content-transition relative z-10 flex flex-1 flex-col">
        <PlaylistHeaderSkeleton />
        <div className="min-w-0 flex-1 overflow-hidden px-6 pb-10">
          <PlaylistLoading />
        </div>
      </div>
    </div>
  );
}

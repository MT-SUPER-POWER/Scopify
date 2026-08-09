import PlaylistHeaderSkeleton from "@/components/Playlist/HeaderSkeleton";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";

export function PlaylistPageSkeleton() {
  return (
    <div className="bg-surface-raised relative flex min-h-full w-full flex-col font-sans">
      <div className="from-content/5 pointer-events-none absolute inset-x-0 top-0 h-100 bg-linear-to-b to-transparent" />
      <div className="bg-surface-raised from-hero-shade via-surface-raised to-surface-raised relative z-10 flex flex-1 flex-col bg-linear-to-b via-20%">
        <PlaylistHeaderSkeleton />
        <div className="min-w-0 flex-1 overflow-hidden px-6 pb-10">
          <PlaylistLoading />
        </div>
      </div>
    </div>
  );
}

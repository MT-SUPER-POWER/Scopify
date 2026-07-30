import PlaylistHeaderSkeleton from "@/components/Playlist/HeaderSkeleton";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";

export function PlaylistPageSkeleton() {
  return (
    <div className="relative flex min-h-full w-full flex-col bg-[#121212] font-sans">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-100 bg-linear-to-b from-white/5 to-transparent" />
      <div className="relative z-10 flex flex-1 flex-col bg-linear-to-b from-black/20 via-[#121212] via-20% to-[#121212]">
        <PlaylistHeaderSkeleton />
        <div className="min-w-0 flex-1 overflow-hidden px-6 pb-10">
          <PlaylistLoading />
        </div>
      </div>
    </div>
  );
}

import { PlaylistViewLoading } from "@/components/Playlist/lattice/PlaylistViewLoading";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";

export default function Loading() {
  return (
    <div className="pt-8 pb-24">
      <PlaylistLoading />
      <PlaylistViewLoading arm={false} />
    </div>
  );
}

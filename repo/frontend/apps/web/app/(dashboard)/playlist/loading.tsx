import { PlaylistViewLoading } from "@/components/Playlist/lattice/PlaylistViewLoading";
import PlaylistLoading from "@/components/Playlist/PlaylistLoading";

export default function Loading() {
  return (
    <>
      <PlaylistLoading />
      <PlaylistViewLoading arm={false} />
    </>
  );
}

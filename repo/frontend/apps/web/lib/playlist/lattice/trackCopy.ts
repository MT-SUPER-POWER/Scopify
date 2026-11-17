import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";

export function getLatticeTrackCopy(track: PlaylistLatticeProps["tracks"][number]) {
  return {
    key: String(track.id),
    title: track.name,
    artist: track.ar.map((artist) => artist.name).join(" / "),
    album: track.al.name,
    cover: track.al.picUrl || track.al.coverUrl,
  };
}

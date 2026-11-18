import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";
import { playerTrackKey } from "@/lib/player/trackIdentity";

export function getLatticeTrackCopy(track: PlaylistLatticeProps["tracks"][number]) {
  return {
    key: playerTrackKey(track),
    title: track.title,
    artist: track.artists.map((artist) => artist.name).join(" / "),
    album: track.album?.title ?? "",
    cover: track.album?.coverUrl,
  };
}

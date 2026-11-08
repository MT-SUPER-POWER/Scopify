import type { MusicCapability } from "@scopify/music-domain/capability";
import type { MusicProviderClient } from "@scopify/music-domain/provider";

import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { requestData } from "@/lib/providers/netease/client";
import type { NeteaseSongDetailDto } from "@/types/providers/netease/trackApi";

/** Every existing page is built on NetEase, so it declares every capability. */
const NETEASE_CAPABILITIES: ReadonlySet<MusicCapability> = new Set<MusicCapability>([
  "track.read",
  "track.play",
  "track.lyrics",
  "track.like",
  "search",
  "playlist.read",
  "playlist.manage",
  "playlist.reorder",
  "library.playlists",
  "artist.read",
  "album.read",
  "recommend.daily",
  "recommend.fm",
  "mv",
  "comments.read",
  "comments.write",
  "cloud",
  "podcast",
  "social",
  "messages",
  "vip",
]);

export const neteaseProvider: MusicProviderClient = {
  provider: "netease",
  capabilities: NETEASE_CAPABILITIES,
  async getTracks(ids, signal) {
    if (ids.length === 0) return [];
    const data = await requestData<NeteaseSongDetailDto>({
      url: "/song/detail",
      params: { ids: ids.join(",") },
      signal,
    });
    const byId = new Map((data.songs ?? []).map((song) => [String(song.id), song]));
    return ids.flatMap((id) => {
      const song = byId.get(id);
      return song ? [adaptNeteaseTrack(song)] : [];
    });
  },
};

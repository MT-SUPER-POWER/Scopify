import { musicLyricsToSource } from "@/lib/lyrics/musicLyrics";
import { getMusicProvider } from "@/lib/providers";
import { getCloudLyric } from "@/lib/providers/netease/api/cloud";
import { useUserStore } from "@/store/module/user";
import { getCloudLyricText } from "@/types/library/cloudApi";
import type { LyricSource } from "@/types/lyrics/model";
import type { PlayerTrack } from "@/types/player/model";

function hasLyricText(lyric: LyricSource) {
  return Boolean(lyric.lrc?.lyric?.trim() || lyric.yrc?.lyric?.trim());
}

/**
 * Loads a track's lyric from its platform. For a NetEase cloud upload without one, falls back
 * to the LYRICS tag embedded in the uploaded file.
 */
export async function getTrackLyric(
  track: PlayerTrack,
  signal?: AbortSignal,
): Promise<LyricSource> {
  const data = musicLyricsToSource(
    await getMusicProvider(track.ref.provider).getLyrics(track.ref, signal),
  );
  const cloudSongId = track.netease?.pc?.privateCloud?.songId ?? null;
  const userId = useUserStore.getState().user?.userId;
  if (hasLyricText(data) || !cloudSongId || !userId) return data;

  try {
    const lyric = getCloudLyricText((await getCloudLyric(userId, cloudSongId)).data);
    return lyric ? { ...data, code: 200, lrc: { lyric, version: 1 } } : data;
  } catch (error) {
    // The NetEase response is still usable, e.g. to mark the track as pure music.
    console.warn("获取云盘歌词失败:", error);
    return data;
  }
}

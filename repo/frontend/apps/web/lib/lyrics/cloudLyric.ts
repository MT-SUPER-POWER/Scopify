import { getCloudLyric } from "@/lib/api/cloud";
import { getLyric } from "@/lib/api/music";
import { useUserStore } from "@/store/module/user";
import { getCloudLyricText, getCloudSongId } from "@/types/library/cloudApi";
import type { NeteaseLyric, SongDetail } from "@/types/song/api";

function hasLyricText(lyric: NeteaseLyric) {
  return Boolean(lyric.lrc?.lyric?.trim() || lyric.yrc?.lyric?.trim());
}

/**
 * Loads the NetEase lyric and, for cloud uploads without one, falls back to the
 * LYRICS tag embedded in the uploaded file.
 */
export async function getSongLyric(song: SongDetail): Promise<NeteaseLyric> {
  const { data } = await getLyric(song.id);
  const cloudSongId = getCloudSongId(song);
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

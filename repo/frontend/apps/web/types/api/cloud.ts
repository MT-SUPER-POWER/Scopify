import { CLOUD_SONG_FALLBACK_COVER } from "@/constants/cloud";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/api/music";

/** `/user/cloud` 列表项；未匹配到公开曲目的上传文件，`simpleSong` 只有文件元数据。 */
export interface RawCloudSong {
  addTime?: number;
  album?: string;
  artist?: string;
  bitrate?: number;
  fileName?: string;
  fileSize?: number;
  simpleSong?: RawSongDetail;
  songId: number;
  songName?: string;
}

export interface UserCloudResponse {
  code: number;
  count?: number;
  data?: RawCloudSong[];
  hasMore?: boolean;
  /** 字节数，后端以字符串返回。 */
  maxSize?: number | string;
  size?: number | string;
}

export interface CloudDriveData {
  maxSize: number;
  tracks: SongDetail[];
  usedSize: number;
}

export interface CloudUploadProgress {
  current: number;
  percent: number;
  total: number;
}

function toByteCount(value: number | string | undefined) {
  const bytes = Number(value);
  return Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
}

export function pruneCloudSong(raw: RawCloudSong): SongDetail {
  const song = raw.simpleSong;
  const detail = pruneSongDetail({
    ...song,
    id: song?.id ?? raw.songId,
    name: song?.name || raw.songName || raw.fileName || String(raw.songId),
  });

  // 未匹配的文件没有歌手和专辑，回退到上传时解析出的文件元数据。
  if (detail.ar.every((artist) => !artist.name) && raw.artist) {
    detail.ar = [{ id: 0, name: raw.artist }];
  }
  if (detail.al.id === 0 && !(song?.al?.name ?? song?.album?.name)) {
    detail.al = { ...detail.al, name: raw.album ?? "" };
  }
  if (!detail.al.picUrl) detail.al = { ...detail.al, picUrl: CLOUD_SONG_FALLBACK_COVER };
  // 未匹配文件的 dt 常为 0，按文件大小与码率（kbps）估算时长。
  if (!detail.dt && raw.fileSize && raw.bitrate) {
    detail.dt = Math.round((raw.fileSize * 8) / raw.bitrate);
  }
  // 日期列展示上传时间，比发行时间更符合云盘语义。
  if (raw.addTime) detail.publishTime = raw.addTime;
  // 删除、匹配、下载都要用云盘自己的 songId；匹配后播放 ID 会变成公开曲目的 ID。
  detail.pc = {
    privateCloud: {
      ...detail.pc?.privateCloud,
      bitRate: raw.bitrate,
      fileSize: raw.fileSize,
      name: raw.fileName,
      simpleSongId: song?.id,
      songId: raw.songId,
    },
  };
  return detail;
}

export function getCloudUsage(response: UserCloudResponse) {
  return { maxSize: toByteCount(response.maxSize), usedSize: toByteCount(response.size) };
}

/** 云盘操作使用的 songId；不是云盘歌曲时返回 null。 */
export function getCloudSongId(track: SongDetail): number | null {
  return track.pc?.privateCloud?.songId ?? null;
}

/** 未匹配的上传文件没有专辑实体，匹配到公开曲目后才有专辑 ID。 */
export function isCloudSongMatched(track: SongDetail) {
  return track.al.id !== 0;
}

export interface CloudDownloadResponse {
  code: number;
  data?: { url?: string | null } | null;
  url?: string | null;
}

export function getCloudDownloadUrl(response: CloudDownloadResponse) {
  return response.data?.url ?? response.url ?? null;
}

export interface CloudLyricResponse {
  code: number;
  data?: { lrc?: string | null; lyric?: string | null } | null;
  lrc?: string | null;
  lyric?: string | null;
}

export function getCloudLyricText(response: CloudLyricResponse) {
  const text = response.lrc ?? response.lyric ?? response.data?.lrc ?? response.data?.lyric ?? null;
  return text?.trim() ? text : null;
}

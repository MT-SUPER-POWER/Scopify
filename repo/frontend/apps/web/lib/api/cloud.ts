import type {
  CloudDownloadResponse,
  CloudLyricResponse,
  UserCloudResponse,
} from "@/types/library/cloudApi";
import request, { requestConfig } from "../web/request";

/** 大文件上传不受用户网络超时设置限制。 */
const CLOUD_UPLOAD_TIMEOUT = 10 * 60 * 1000;

// /user/cloud
export function getUserCloud(limit = 200, offset = 0) {
  return request.get<UserCloudResponse>(
    "/user/cloud",
    requestConfig({ params: { limit, offset, timestamp: Date.now() }, requiresMusicSession: true }),
  );
}

// /user/cloud/del
export function deleteCloudSong(id: number) {
  return request.get<{ code: number }>(
    "/user/cloud/del",
    requestConfig({ params: { id, timestamp: Date.now() }, requiresMusicSession: true }),
  );
}

// /cloud
export function uploadCloudSong(file: File, onProgress?: (percent: number) => void) {
  const formData = new FormData();
  formData.append("songFile", file);
  return request.post<{ code: number }>(
    `/cloud?timestamp=${Date.now()}`,
    formData,
    requestConfig({
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
      requiresMusicSession: true,
      transferTimeout: CLOUD_UPLOAD_TIMEOUT,
    }),
  );
}

// /song/cloud/download
export function getCloudDownload(id: number) {
  return request.get<CloudDownloadResponse>(
    "/song/cloud/download",
    requestConfig({ params: { id, timestamp: Date.now() }, requiresMusicSession: true }),
  );
}

// /cloud/match，asid 传 0 取消匹配
export function matchCloudSong(uid: number, sid: number, asid: number) {
  return request.get<{ code: number }>(
    "/cloud/match",
    requestConfig({
      params: { asid, sid, timestamp: Date.now(), uid },
      requiresMusicSession: true,
    }),
  );
}

// /cloud/lyric/get，歌词来自上传文件的 LYRICS 元数据
export function getCloudLyric(uid: number, sid: number) {
  return request.get<CloudLyricResponse>(
    "/cloud/lyric/get",
    requestConfig({ params: { sid, uid }, requiresMusicSession: true }),
  );
}

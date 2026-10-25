"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  deleteCloudSong,
  getCloudDownload,
  getUserCloud,
  matchCloudSong,
  uploadCloudSong,
} from "@/lib/api/cloud";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import {
  getCloudDownloadUrl,
  getCloudSongId,
  getCloudUsage,
  pruneCloudSong,
  type CloudDriveData,
  type CloudUploadProgress,
} from "@/types/api/cloud";
import type { SongDetail } from "@/types/api/music";

const CLOUD_PAGE_SIZE = 200;
/** 网易云盘上限约数千首，限制页数避免异常 hasMore 造成无限请求。 */
const CLOUD_MAX_PAGES = 30;

async function fetchCloudDrive(): Promise<CloudDriveData> {
  const tracks: SongDetail[] = [];
  let usage = { maxSize: 0, usedSize: 0 };

  for (let page = 0; page < CLOUD_MAX_PAGES; page += 1) {
    const { data } = await getUserCloud(CLOUD_PAGE_SIZE, page * CLOUD_PAGE_SIZE);
    if (page === 0) usage = getCloudUsage(data);
    const items = data.data ?? [];
    tracks.push(...items.map(pruneCloudSong));
    if (!data.hasMore || items.length === 0) break;
  }

  return { ...usage, tracks };
}

export function useCloudDrive() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);
  const queryKey = musicQueryKeys.library.cloud(userId ?? 0);
  const [uploadProgress, setUploadProgress] = useState<CloudUploadProgress | null>(null);

  const query = useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey,
    queryFn: fetchCloudDrive,
  });

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || uploadProgress) return;
      let uploaded = 0;

      for (const [index, file] of files.entries()) {
        setUploadProgress({ current: index + 1, percent: 0, total: files.length });
        try {
          await uploadCloudSong(file, (percent) =>
            setUploadProgress({ current: index + 1, percent, total: files.length }),
          );
          uploaded += 1;
        } catch {
          toast.error(t("library.cloud.uploadFailed", { name: file.name }));
        }
      }

      setUploadProgress(null);
      if (uploaded > 0) {
        toast.success(t("library.cloud.uploadSuccess", { count: uploaded }));
        await queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey, t, uploadProgress],
  );

  const removeTrack = useCallback(
    async (track: SongDetail) => {
      const cloudSongId = getCloudSongId(track) ?? track.id;
      try {
        await deleteCloudSong(cloudSongId);
        queryClient.setQueryData<CloudDriveData>(queryKey, (data) =>
          data
            ? {
                ...data,
                tracks: data.tracks.filter(
                  (item) => (getCloudSongId(item) ?? item.id) !== cloudSongId,
                ),
              }
            : data,
        );
        toast.success(t("library.cloud.removeSuccess"));
        // 删除后已用空间由服务端重新计算。
        void queryClient.invalidateQueries({ queryKey });
      } catch {
        toast.error(t("library.cloud.removeFailed"));
      }
    },
    [queryClient, queryKey, t],
  );

  /** asid 为 0 时取消匹配，文件恢复为上传时的元数据。 */
  const matchTrack = useCallback(
    async (track: SongDetail, adjustSongId: number) => {
      const cloudSongId = getCloudSongId(track);
      if (!userId || !cloudSongId) return false;
      try {
        await matchCloudSong(userId, cloudSongId, adjustSongId);
        toast.success(
          t(adjustSongId ? "library.cloud.matchSuccess" : "library.cloud.unmatchSuccess"),
        );
        await queryClient.invalidateQueries({ queryKey });
        return true;
      } catch {
        toast.error(t("library.cloud.matchFailed"));
        return false;
      }
    },
    [queryClient, queryKey, t, userId],
  );

  const downloadTrack = useCallback(
    async (track: SongDetail) => {
      try {
        const { data } = await getCloudDownload(getCloudSongId(track) ?? track.id);
        const url = getCloudDownloadUrl(data);
        if (!url) throw new Error("Missing cloud download URL");
        window.open(url, "_blank", "noopener");
      } catch {
        toast.error(t("library.cloud.downloadFailed"));
      }
    },
    [t],
  );

  return {
    downloadTrack,
    isLoggedIn,
    matchTrack,
    query,
    removeTrack,
    uploadFiles,
    uploadProgress,
  };
}

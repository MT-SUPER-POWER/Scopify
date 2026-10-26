"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLyric } from "@/lib/api/music";
import { buildLyricExport, downloadLyricExport } from "@/lib/lyrics/export";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { LyricExportFormat } from "@/types/lyrics";

export function useSearchLyricExport(song: SongDetail) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["search-lyric-export", song.id],
    mutationFn: async (format: LyricExportFormat) => {
      const lyric = await queryClient.fetchQuery({
        queryKey: ["search-lyric-export", song.id],
        queryFn: async () => (await getLyric(song.id)).data,
        staleTime: 5 * 60 * 1000,
        retry: false,
      });
      const file = buildLyricExport(song, lyric, format);
      if (!file) {
        toast.error(t("lyrics.tab.exportEmpty"));
        return;
      }
      downloadLyricExport(file);
      toast.success(t("lyrics.tab.exported"));
    },
    onError: (error) => {
      toast.error(t("common.message.operationFailedWithReason", { message: error.message }));
    },
    throwOnError: false,
    retry: false,
  });
}

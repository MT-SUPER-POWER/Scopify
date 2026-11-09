"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNeteaseLyricSource } from "@/lib/lyrics/musicLyrics";
import { buildLyricExport, downloadLyricExport } from "@/lib/lyrics/export";
import { useTranslation } from "react-i18next";

import type { SongDetail } from "@/types/song/api";
import type { LyricExportFormat } from "@/types/lyrics/model";

export function useSearchLyricExport(song: SongDetail) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["search-lyric-export", song.id],
    mutationFn: async (format: LyricExportFormat) => {
      const lyric = await queryClient.fetchQuery({
        queryKey: ["search-lyric-export", song.id],
        queryFn: async () => await getNeteaseLyricSource(song.id),
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

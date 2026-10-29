"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { getLyric } from "@/lib/api/music";
import {
  clearImportedLyricOverride,
  clearLyricMatchOverride,
  clearLyricSourceSelection,
  getImportedLyricOverride,
  getLyricMatchOverride,
  getLyricSourceSelection,
  setCachedLyric,
  setImportedLyricOverride,
  setLyricSourceSelection,
} from "@/lib/cache/playbackCache";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { buildLyricExport, downloadLyricExport } from "@/lib/lyrics/export";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import { useLyricStageStore } from "@/store/module/lyrics";
import type {
  ImportedLyricOverride,
  LyricExportFormat,
  LyricSourceSelection,
} from "@/types/lyrics/model";
import type { NeteaseLyric } from "@/types/song/api";

/** 读本地保存的导入歌词与歌词来源；来源选了「导入」但文件已不在时按「在线」算。 */
async function readLyricSource(songId: number) {
  const [importedLyric, source] = await Promise.all([
    getImportedLyricOverride(songId),
    getLyricSourceSelection(songId),
  ]);
  return {
    importedLyric,
    source: (source === "imported" && importedLyric
      ? "imported"
      : "online") as LyricSourceSelection,
  };
}

/**
 * 歌词面板「来源」页：当前用在线歌词还是导入的文件、时间轴偏移、导入 / 导出 / 清除。
 * 本地保存的来源由 Query 管理，和「匹配歌词」共用缓存：任一处改了歌词来源，另一处会跟着刷新。
 * 切换、导入、清除是用户操作，反馈留在操作本身。
 */
export function useOnlineLyricsTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const song = usePlayerStore((state) => state.currentSongDetail);
  const lyric = usePlayerStore((state) => state.lyric);
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const [isUpdating, setIsUpdating] = useState(false);
  const songId = song?.id ?? 0;
  const sourceQuery = useQuery({
    queryKey: musicQueryKeys.lyrics.source(songId),
    queryFn: () => readLyricSource(songId),
    enabled: song !== null,
  });
  const importedLyric = song ? (sourceQuery.data?.importedLyric ?? null) : null;
  const source = song ? (sourceQuery.data?.source ?? "online") : "online";

  const setSourceState = useCallback(
    (
      id: number,
      next: { importedLyric: ImportedLyricOverride | null; source: LyricSourceSelection },
    ) => queryClient.setQueryData(musicQueryKeys.lyrics.source(id), next),
    [queryClient],
  );

  const setLyricOffsetMs = useCallback((offsetMs: number) => {
    useLyricStageStore.getState().patchSettings({ lyricOffsetMs: offsetMs });
  }, []);

  const selectSource = useCallback(
    async (nextSource: LyricSourceSelection) => {
      if (!song || isUpdating || (nextSource === "imported" && !importedLyric)) return;

      setIsUpdating(true);
      try {
        const nextLyric =
          nextSource === "imported"
            ? importedLyric?.lyric
            : ((await getLyricMatchOverride(song.id))?.lyric ?? (await getLyric(song.id)).data);
        if (!nextLyric) return;

        await setLyricSourceSelection(song.id, nextSource);
        usePlayerStore.getState().setLyric(nextLyric);
        setSourceState(song.id, { importedLyric, source: nextSource });
      } catch (error) {
        console.error("Lyrics source selection failed", error);
        toast.error(t("lyrics.tab.sourceChangeFailed"));
      } finally {
        setIsUpdating(false);
      }
    },
    [importedLyric, isUpdating, setSourceState, song, t],
  );

  const importLyricFile = useCallback(
    async (file: File) => {
      if (!song || isUpdating) return;

      setIsUpdating(true);
      try {
        const content = await file.text();
        const lyric: NeteaseLyric = file.name.toLocaleLowerCase().endsWith(".yrc")
          ? { code: 200, yrc: { lyric: content, version: 1 } }
          : { code: 200, lrc: { lyric: content, version: 1 } };
        if (adaptNeteaseLyric(lyric).lines.length === 0) {
          toast.error(t("lyrics.tab.importInvalid"));
          return;
        }

        const nextImportedLyric: ImportedLyricOverride = {
          fileName: file.name,
          importedAt: Date.now(),
          lyric,
        };
        await Promise.all([
          setImportedLyricOverride(song.id, nextImportedLyric),
          setLyricSourceSelection(song.id, "imported"),
        ]);
        usePlayerStore.getState().setLyric(lyric);
        setSourceState(song.id, { importedLyric: nextImportedLyric, source: "imported" });
        toast.success(t("lyrics.tab.imported"));
      } catch (error) {
        console.error("Lyric import failed", error);
        toast.error(t("lyrics.tab.importFailed"));
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, setSourceState, song, t],
  );

  const clearLyricsState = useCallback(async () => {
    if (!song || isUpdating) return;

    setIsUpdating(true);
    try {
      await Promise.all([
        clearImportedLyricOverride(song.id),
        clearLyricMatchOverride(song.id),
        clearLyricSourceSelection(song.id),
      ]);
      const response = await getLyric(song.id);
      await setCachedLyric(song.id, response.data);
      usePlayerStore.getState().setLyric(response.data);
      setSourceState(song.id, { importedLyric: null, source: "online" });
      // 匹配也一起清掉了，「匹配歌词」里显示的已保存匹配要跟着失效
      queryClient.setQueryData(musicQueryKeys.lyrics.matchOverride(song.id), null);
      toast.success(t("lyrics.tab.cleared"));
    } catch (error) {
      console.error("Lyrics state reset failed", error);
      toast.error(t("lyrics.tab.clearFailed"));
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, queryClient, setSourceState, song, t]);

  // Exports the raw branch now on stage, so the file re-imports through `importLyricFile` as-is.
  const exportableFormats: LyricExportFormat[] = [
    ...(lyric?.lrc?.lyric?.trim() ? (["lrc"] as const) : []),
    ...(lyric?.yrc?.lyric?.trim() ? (["yrc"] as const) : []),
  ];

  const exportLyric = useCallback(
    (format: LyricExportFormat) => {
      const file = song && lyric ? buildLyricExport(song, lyric, format) : null;
      if (!file) {
        toast.error(t("lyrics.tab.exportEmpty"));
        return;
      }
      downloadLyricExport(file);
      toast.success(t("lyrics.tab.exported"));
    },
    [lyric, song, t],
  );

  return {
    clearLyricsState,
    exportableFormats,
    exportLyric,
    importedLyric,
    importLyricFile,
    isUpdating,
    lyricOffsetMs,
    selectSource,
    setLyricOffsetMs,
    source,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
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
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import { useLyricStageStore } from "@/store/module/lyrics";
import type {
  ImportedLyricOverride,
  LyricExportFormat,
  LyricSourceSelection,
} from "@/types/lyrics/model";
import type { NeteaseLyric } from "@/types/song/api";

export function useOnlineLyricsTab() {
  const { t } = useI18n();
  const song = usePlayerStore((state) => state.currentSongDetail);
  const lyric = usePlayerStore((state) => state.lyric);
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const [importedLyric, setImportedLyric] = useState<ImportedLyricOverride | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [source, setSource] = useState<LyricSourceSelection>("online");

  useEffect(() => {
    if (!song) {
      setImportedLyric(null);
      setSource("online");
      return;
    }

    let cancelled = false;
    void Promise.all([getImportedLyricOverride(song.id), getLyricSourceSelection(song.id)]).then(
      ([nextImportedLyric, nextSource]) => {
        if (cancelled) return;
        setImportedLyric(nextImportedLyric);
        setSource(nextSource === "imported" && nextImportedLyric ? "imported" : "online");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [song]);

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
        setSource(nextSource);
      } catch (error) {
        console.error("Lyrics source selection failed", error);
        toast.error(t("lyrics.tab.sourceChangeFailed"));
      } finally {
        setIsUpdating(false);
      }
    },
    [importedLyric, isUpdating, song, t],
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
        setImportedLyric(nextImportedLyric);
        setSource("imported");
        toast.success(t("lyrics.tab.imported"));
      } catch (error) {
        console.error("Lyric import failed", error);
        toast.error(t("lyrics.tab.importFailed"));
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, song, t],
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
      setImportedLyric(null);
      setSource("online");
      toast.success(t("lyrics.tab.cleared"));
    } catch (error) {
      console.error("Lyrics state reset failed", error);
      toast.error(t("lyrics.tab.clearFailed"));
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, song, t]);

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

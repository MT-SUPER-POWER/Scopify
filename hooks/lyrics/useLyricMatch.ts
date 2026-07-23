"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { searchSongs } from "@/lib/api/search";
import {
  clearLyricMatchOverride,
  getLyricMatchOverride,
  setLyricSourceSelection,
  setCachedLyric,
  setLyricMatchOverride,
} from "@/lib/cache/playbackCache";
import { getLyric } from "@/lib/api/music";
import {
  buildLyricMatchQuery,
  getLyricMatchScore,
  hasUsableNeteaseLyric,
  mapSongSearchResourceToLyricMatchCandidate,
} from "@/lib/lyrics/match";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { usePlayerStore } from "@/store/module/player";
import { useI18n } from "@/store/module/i18n";
import type { LyricDisplayLine, LyricMatchCandidate, LyricMatchOverride } from "@/types/lyrics";

export function useLyricMatch(isOpen: boolean) {
  const { t } = useI18n();
  const song = usePlayerStore((state) => state.currentSongDetail);
  const [candidates, setCandidates] = useState<LyricMatchCandidate[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewPureMusic, setIsPreviewPureMusic] = useState(false);
  const [override, setOverride] = useState<LyricMatchOverride | null>(null);
  const [previewLines, setPreviewLines] = useState<LyricDisplayLine[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const search = useCallback(
    async (nextQuery: string) => {
      if (!nextQuery.trim()) {
        setCandidates([]);
        setSelectedId(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchSongs(nextQuery.trim(), 15);
        const nextCandidates = (response.data?.data?.resources ?? [])
          .map(mapSongSearchResourceToLyricMatchCandidate)
          .filter((candidate): candidate is LyricMatchCandidate => Boolean(candidate?.name));
        const sortedCandidates = song
          ? nextCandidates.sort(
              (left, right) => getLyricMatchScore(song, right) - getLyricMatchScore(song, left),
            )
          : nextCandidates;

        setCandidates(sortedCandidates);
        setSelectedId(sortedCandidates[0]?.id ?? null);
      } catch (error) {
        console.error("Lyric match search failed", error);
        toast.error(t("lyrics.match.searchFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [song, t],
  );

  useEffect(() => {
    if (!song) {
      setOverride(null);
      return;
    }

    let cancelled = false;
    void getLyricMatchOverride(song.id).then((nextOverride) => {
      if (!cancelled) setOverride(nextOverride);
    });
    return () => {
      cancelled = true;
    };
  }, [song]);

  useEffect(() => {
    if (!isOpen || !song) return;
    const initialQuery = buildLyricMatchQuery(song);
    setQuery(initialQuery);
    void search(initialQuery);
  }, [isOpen, search, song]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  useEffect(() => {
    if (!selectedCandidate) {
      setPreviewLines([]);
      setIsPreviewPureMusic(false);
      setIsPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setIsPreviewLoading(true);
    setPreviewLines([]);
    setIsPreviewPureMusic(false);

    void getLyric(selectedCandidate.id)
      .then((response) => {
        if (cancelled) return;
        const preview = adaptNeteaseLyric(response.data);
        setPreviewLines(preview.lines);
        setIsPreviewPureMusic(preview.isPureMusic);
      })
      .catch((error) => {
        console.error("Lyric match preview failed", error);
        if (!cancelled) setPreviewLines([]);
        if (!cancelled) setIsPreviewPureMusic(false);
      })
      .finally(() => {
        if (!cancelled) setIsPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCandidate]);

  const applyMatch = useCallback(async () => {
    if (!song || !selectedCandidate) return false;

    setIsApplying(true);
    try {
      const response = await getLyric(selectedCandidate.id);
      if (!hasUsableNeteaseLyric(response.data)) {
        toast.error(t("lyrics.match.noLyrics"));
        return false;
      }

      const nextOverride: LyricMatchOverride = {
        candidate: selectedCandidate,
        lyric: response.data,
        matchedAt: Date.now(),
      };
      await Promise.all([
        setLyricMatchOverride(song.id, nextOverride),
        setLyricSourceSelection(song.id, "online"),
      ]);
      usePlayerStore.getState().setLyric(response.data);
      setOverride(nextOverride);
      toast.success(t("lyrics.match.saved"));
      return true;
    } catch (error) {
      console.error("Lyric match apply failed", error);
      toast.error(t("lyrics.match.applyFailed"));
      return false;
    } finally {
      setIsApplying(false);
    }
  }, [selectedCandidate, song, t]);

  const restoreOriginalLyrics = useCallback(async () => {
    if (!song) return;

    setIsApplying(true);
    try {
      await clearLyricMatchOverride(song.id);
      const response = await getLyric(song.id);
      await setCachedLyric(song.id, response.data);
      usePlayerStore.getState().setLyric(response.data);
      setOverride(null);
      toast.success(t("lyrics.match.restored"));
    } catch (error) {
      console.error("Original lyric restore failed", error);
      toast.error(t("lyrics.match.restoreFailed"));
    } finally {
      setIsApplying(false);
    }
  }, [song, t]);

  return {
    applyMatch,
    candidates,
    isApplying,
    isLoading,
    isPreviewLoading,
    isPreviewPureMusic,
    override,
    previewLines,
    query,
    restoreOriginalLyrics,
    search,
    selectedCandidate,
    setQuery,
    setSelectedId,
    song,
  };
}

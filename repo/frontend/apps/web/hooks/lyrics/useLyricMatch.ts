"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { getLyric } from "@/lib/api/music";
import { searchSongs } from "@/lib/api/search";
import {
  clearLyricMatchOverride,
  getLyricMatchOverride,
  setCachedLyric,
  setLyricMatchOverride,
  setLyricSourceSelection,
} from "@/lib/cache/playbackCache";
import {
  buildLyricMatchQuery,
  hasUsableNeteaseLyric,
  sortLyricMatchCandidates,
  toLyricMatchCandidates,
} from "@/lib/lyrics/match";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "@/store/module/player";
import type { LyricMatchOverride } from "@/types/lyrics/model";

const CANDIDATE_LIMIT = 15;

/**
 * 「匹配歌词」：为当前歌曲搜索候选曲目、预览所选曲目的歌词，并把它存为这首歌的歌词。
 * 候选搜索、歌词预览与已保存的匹配都由 Query 管理；请求失败交给对话框原地显示并重试，
 * 不再当作「未找到」或「没有歌词」。使用 / 还原是用户操作，反馈留在操作本身。
 */
export function useLyricMatch(isOpen: boolean) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const song = usePlayerStore((state) => state.currentSongDetail);
  const [openedFor, setOpenedFor] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pickedId, setSelectedId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // 打开对话框（或打开期间切歌）时用当前歌名和歌手预填并直接搜索
  const target = isOpen && song ? song.id : null;
  if (target !== openedFor) {
    setOpenedFor(target);
    if (song && target !== null) {
      const initialQuery = buildLyricMatchQuery(song);
      setQuery(initialQuery);
      setKeyword(initialQuery.trim());
      setSelectedId(null);
    }
  }

  const songId = song?.id ?? 0;
  const overrideQuery = useQuery({
    queryKey: musicQueryKeys.lyrics.matchOverride(songId),
    queryFn: () => getLyricMatchOverride(songId),
    enabled: song !== null,
  });

  const searchQuery = useQuery({
    queryKey: musicQueryKeys.search.matchCandidates(keyword, CANDIDATE_LIMIT),
    queryFn: async () =>
      toLyricMatchCandidates(
        (await searchSongs(keyword, CANDIDATE_LIMIT)).data?.data?.resources ?? [],
      ),
    enabled: isOpen && keyword.length > 0,
  });

  const candidates = useMemo(
    () => sortLyricMatchCandidates(searchQuery.data ?? [], song),
    [searchQuery.data, song],
  );
  // 没手动选过，或选中的那首不在这次结果里时，默认选最匹配的第一首
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === pickedId) ?? candidates[0] ?? null;

  const previewId = selectedCandidate?.id ?? 0;
  const previewQuery = useQuery({
    queryKey: musicQueryKeys.lyrics.matchPreview(previewId),
    queryFn: async () => adaptNeteaseLyric((await getLyric(previewId)).data),
    enabled: isOpen && selectedCandidate !== null,
  });

  const search = (nextQuery: string) => {
    setKeyword(nextQuery.trim());
    setSelectedId(null);
  };

  const setOverride = useCallback(
    (songId: number, override: LyricMatchOverride | null) =>
      queryClient.setQueryData(musicQueryKeys.lyrics.matchOverride(songId), override),
    [queryClient],
  );

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
      setOverride(song.id, nextOverride);
      // 歌词面板的「来源」随之切回在线
      void queryClient.invalidateQueries({ queryKey: musicQueryKeys.lyrics.source(song.id) });
      toast.success(t("lyrics.match.saved"));
      return true;
    } catch (error) {
      console.error("Lyric match apply failed", error);
      toast.error(t("lyrics.match.applyFailed"));
      return false;
    } finally {
      setIsApplying(false);
    }
  }, [queryClient, selectedCandidate, setOverride, song, t]);

  const restoreOriginalLyrics = useCallback(async () => {
    if (!song) return;

    setIsApplying(true);
    try {
      await clearLyricMatchOverride(song.id);
      const response = await getLyric(song.id);
      await setCachedLyric(song.id, response.data);
      usePlayerStore.getState().setLyric(response.data);
      setOverride(song.id, null);
      toast.success(t("lyrics.match.restored"));
    } catch (error) {
      console.error("Original lyric restore failed", error);
      toast.error(t("lyrics.match.restoreFailed"));
    } finally {
      setIsApplying(false);
    }
  }, [setOverride, song, t]);

  return {
    applyMatch,
    candidates,
    isApplying,
    isLoading: searchQuery.isFetching,
    isSearchError: searchQuery.data === undefined && searchQuery.isError,
    isPreviewError: previewQuery.data === undefined && previewQuery.isError,
    isPreviewLoading: previewQuery.isFetching && previewQuery.data === undefined,
    isPreviewPureMusic: previewQuery.data?.isPureMusic ?? false,
    override: overrideQuery.data ?? null,
    previewLines: previewQuery.data?.lines ?? [],
    query,
    restoreOriginalLyrics,
    retryPreview: () => void previewQuery.refetch(),
    retrySearch: () => void searchQuery.refetch(),
    search,
    selectedCandidate,
    setQuery,
    setSelectedId,
    song,
  };
}

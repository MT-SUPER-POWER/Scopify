"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { searchSongs } from "@/lib/api/search";
import { getLyricMatchScore, mapSongSearchResourceToLyricMatchCandidate } from "@/lib/lyrics/match";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/song/api";
import type { LyricMatchCandidate } from "@/types/lyrics";

/** 为云盘文件搜索可匹配的公开曲目，按标题、歌手、时长相似度排序。 */
export function useCloudMatchSearch(song: SongDetail | null) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<LyricMatchCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(
    async (nextQuery: string) => {
      const keyword = nextQuery.trim();
      if (!keyword) {
        setCandidates([]);
        setSelectedId(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchSongs(keyword, 20);
        const nextCandidates = (response.data?.data?.resources ?? [])
          .map(mapSongSearchResourceToLyricMatchCandidate)
          .filter((candidate): candidate is LyricMatchCandidate => Boolean(candidate?.name));
        if (song) {
          nextCandidates.sort(
            (left, right) => getLyricMatchScore(song, right) - getLyricMatchScore(song, left),
          );
        }
        setCandidates(nextCandidates);
        setSelectedId(nextCandidates[0]?.id ?? null);
      } catch {
        toast.error(t("library.cloud.matchSearchFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [song, t],
  );

  // 打开时用当前歌名和歌手预填并直接搜索。
  useEffect(() => {
    if (!song) return;
    const initialQuery = [song.name, song.ar[0]?.name].filter(Boolean).join(" ");
    setQuery(initialQuery);
    void search(initialQuery);
  }, [search, song]);

  return { candidates, isLoading, query, search, selectedId, setQuery, setSelectedId };
}

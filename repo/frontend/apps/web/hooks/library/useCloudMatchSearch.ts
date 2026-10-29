"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { searchSongs } from "@/lib/api/search";
import { getLyricMatchScore, mapSongSearchResourceToLyricMatchCandidate } from "@/lib/lyrics/match";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { SongDetail } from "@/types/song/api";
import type { LyricMatchCandidate } from "@/types/lyrics/model";

const CANDIDATE_LIMIT = 20;

const toInitialQuery = (song: SongDetail | null) =>
  song ? [song.name, song.ar[0]?.name].filter(Boolean).join(" ") : "";

/**
 * 为云盘文件搜索可匹配的公开曲目，按标题、歌手、时长相似度排序。
 * 打开时用当前歌名和歌手预填并直接搜索；之后改词按回车才重新搜。
 * 请求失败交给对话框在列表区显示并重试，不再当作「没有找到」。
 */
export function useCloudMatchSearch(song: SongDetail | null) {
  const [songId, setSongId] = useState(song?.id);
  const [query, setQuery] = useState(() => toInitialQuery(song));
  const [keyword, setKeyword] = useState(() => toInitialQuery(song).trim());
  const [pickedId, setSelectedId] = useState<number | null>(null);

  // 换了一首歌就重新预填：在渲染期间同步，避免先用上一首的词搜一次
  if (song?.id !== songId) {
    const initialQuery = toInitialQuery(song);
    setSongId(song?.id);
    setQuery(initialQuery);
    setKeyword(initialQuery.trim());
    setSelectedId(null);
  }

  const searchQuery = useQuery({
    queryKey: musicQueryKeys.search.cloudMatch(keyword, CANDIDATE_LIMIT),
    queryFn: async () =>
      ((await searchSongs(keyword, CANDIDATE_LIMIT)).data?.data?.resources ?? [])
        .map(mapSongSearchResourceToLyricMatchCandidate)
        .filter((candidate): candidate is LyricMatchCandidate => Boolean(candidate?.name)),
    enabled: song !== null && keyword.length > 0,
  });

  const candidates = useMemo(() => {
    const list = searchQuery.data ?? [];
    if (!song) return list;
    return [...list].sort(
      (left, right) => getLyricMatchScore(song, right) - getLyricMatchScore(song, left),
    );
  }, [searchQuery.data, song]);

  // 没手动选过，或选中的那首不在这次结果里时，默认选最匹配的第一首
  const selectedId = candidates.some((candidate) => candidate.id === pickedId)
    ? pickedId
    : (candidates[0]?.id ?? null);

  const search = (nextQuery: string) => {
    setKeyword(nextQuery.trim());
    setSelectedId(null);
  };

  return {
    candidates,
    error: searchQuery.data === undefined ? searchQuery.error : null,
    hasResult: searchQuery.data !== undefined,
    isLoading: searchQuery.isFetching,
    query,
    retry: () => void searchQuery.refetch(),
    search,
    selectedId,
    setQuery,
    setSelectedId,
  };
}

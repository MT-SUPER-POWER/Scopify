"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getListeningReport,
  getListeningSongPlayRank,
  getTodayListeningSongs,
} from "@/lib/api/listeningReport";
import { getListeningReportSummary } from "@/lib/listeningReport/reportSummary";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useUserStore } from "@/store";
import type {
  ListeningReportPeriod,
  RealtimeListeningReportPeriod,
  SongPlayRankItem,
  TodayListeningSongDTO,
} from "@/types/listeningReport/api";

/** Loads the listening report for the specified period and optional endTime timestamp. */
export function useListeningReportQuery(period: ListeningReportPeriod, endTime?: number) {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId ?? 0);

  return useQuery({
    enabled: isLoggedIn,
    queryKey: musicQueryKeys.listeningReport.period(userId, period, endTime),
    queryFn: async () => {
      const response = await getListeningReport({ endTime, type: period });
      return getListeningReportSummary(response.data, period);
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

/** Loads the top 20 song play ranking for the specified period and endTime. */
export function useListeningSongRankQuery(
  period: RealtimeListeningReportPeriod,
  endTime?: number,
  enabled = true,
) {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId ?? 0);

  return useQuery({
    enabled: isLoggedIn && enabled,
    queryKey: musicQueryKeys.listeningReport.songRank(userId, period, endTime),
    queryFn: async (): Promise<SongPlayRankItem[]> => {
      const response = await getListeningSongPlayRank({ endTime, type: period });
      const rawPayload = response.data?.data;
      if (!rawPayload) return [];
      if (Array.isArray(rawPayload)) return rawPayload;
      if (Array.isArray(rawPayload.list)) return rawPayload.list;
      return [];
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}

/** Loads today's real-time listening history songs. */
export function useTodayListeningSongsQuery() {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId ?? 0);

  return useQuery({
    enabled: isLoggedIn,
    queryKey: musicQueryKeys.listeningReport.todaySongs(userId),
    queryFn: async (): Promise<TodayListeningSongDTO[]> => {
      const response = await getTodayListeningSongs();
      return response.data?.data?.songDTOs ?? [];
    },
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

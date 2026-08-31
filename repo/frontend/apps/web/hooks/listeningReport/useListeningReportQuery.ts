"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getListeningReport,
  getListeningSongPlayRank,
  getTodayListeningSongs,
  getTotalListeningDuration,
} from "@/lib/api/listeningReport";
import { getListeningReportSummary } from "@/lib/listeningReport/reportSummary";
import { getListeningDurationSeconds } from "@/lib/listeningReport/normalize";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";
import type {
  ListeningReportPeriod,
  RealtimeListeningReportPeriod,
  SongPlayRankItem,
  TodayListeningSongDTO,
} from "@/types/api/listeningReport";

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
export function useListeningSongRankQuery(period: RealtimeListeningReportPeriod, endTime?: number) {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId ?? 0);

  return useQuery({
    enabled: isLoggedIn,
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

/** Loads the account's all-time total listening duration. */
export function useTotalListeningDurationQuery() {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId ?? 0);

  return useQuery({
    enabled: isLoggedIn,
    queryKey: musicQueryKeys.listeningReport.total(userId),
    queryFn: async () => {
      const response = await getTotalListeningDuration();
      return getListeningDurationSeconds(response);
    },
    staleTime: 120_000,
  });
}

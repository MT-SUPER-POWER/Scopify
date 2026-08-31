"use client";

import { useQuery } from "@tanstack/react-query";
import { getRealtimeListeningReport, getTotalListeningDuration } from "@/lib/api/listeningReport";
import { getListeningDurationSeconds } from "@/lib/listeningReport/normalize";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";

export function useListeningReportSummary() {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);
  const enabled = isLoggedIn && Boolean(userId);
  const cacheUserId = userId ?? 0;

  const totalQuery = useQuery({
    enabled,
    queryKey: musicQueryKeys.listeningReport.total(cacheUserId),
    queryFn: getTotalListeningDuration,
  });
  const weekQuery = useQuery({
    enabled,
    queryKey: musicQueryKeys.listeningReport.realtime(cacheUserId, "week"),
    queryFn: () => getRealtimeListeningReport("week"),
  });
  const monthQuery = useQuery({
    enabled,
    queryKey: musicQueryKeys.listeningReport.realtime(cacheUserId, "month"),
    queryFn: () => getRealtimeListeningReport("month"),
  });

  return {
    isLoading: totalQuery.isLoading || weekQuery.isLoading || monthQuery.isLoading,
    monthDurationSeconds: getListeningDurationSeconds(monthQuery.data?.data),
    totalDurationSeconds: getListeningDurationSeconds(totalQuery.data?.data),
    weekDurationSeconds: getListeningDurationSeconds(weekQuery.data?.data),
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { getHistoricalDailyRecommendations } from "@/lib/api/playlist";

const HISTORY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const historicalDailyRecommendationKeys = {
  all: ["playlist", "daily-recommendation", "history"] as const,
  dates: () => [...historicalDailyRecommendationKeys.all, "dates"] as const,
};

export function useHistoricalDailyRecommendations(enabled: boolean) {
  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryKey: historicalDailyRecommendationKeys.dates(),
    queryFn: async () => {
      const response = await getHistoricalDailyRecommendations();
      const data = response.data.data ?? {};
      return {
        ...data,
        dates: (data.dates ?? []).filter((date) => HISTORY_DATE_PATTERN.test(date)),
      };
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

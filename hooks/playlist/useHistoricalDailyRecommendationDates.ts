"use client";

import { useQuery } from "@tanstack/react-query";

import { getHistoricalDailyRecommendations } from "@/lib/api/playlist";

const HISTORY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getMusicCookie() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("music_cookie") ?? undefined;
}

export const historicalDailyRecommendationKeys = {
  all: ["playlist", "daily-recommendation", "history"] as const,
  dates: () => [...historicalDailyRecommendationKeys.all, "dates"] as const,
};

export function useHistoricalDailyRecommendationDates(enabled: boolean) {
  return useQuery({
    queryKey: historicalDailyRecommendationKeys.dates(),
    queryFn: async () => {
      const response = await getHistoricalDailyRecommendations(getMusicCookie());
      return (response.data.data?.dates ?? []).filter((date) => HISTORY_DATE_PATTERN.test(date));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

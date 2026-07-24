"use client";

import { useMutation } from "@tanstack/react-query";

import { dislikeDailyRecommend } from "@/lib/api/playlist";

function getMusicCookie() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("music_cookie") ?? undefined;
}

export function useDailyRecommendationMutation() {
  return useMutation({
    meta: { operation: "playlist.daily_recommendation.dislike" },
    mutationFn: async (trackId: number | string) =>
      (await dislikeDailyRecommend(trackId, getMusicCookie())).data,
    mutationKey: ["playlist", "daily-recommendation", "dislike"],
  });
}

"use client";

import { useMutation } from "@tanstack/react-query";

import { dislikeDailyRecommend } from "@/lib/api/playlist";

export function useDailyRecommendationMutation() {
  return useMutation({
    meta: { operation: "playlist.daily_recommendation.dislike" },
    mutationFn: async (trackId: number | string) => (await dislikeDailyRecommend(trackId)).data,
    mutationKey: ["playlist", "daily-recommendation", "dislike"],
  });
}

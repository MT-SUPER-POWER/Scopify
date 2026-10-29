"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDailyCategoryConfigs,
  getDailyCategorySongs,
  setDailyCategoryConfig,
} from "@/lib/api/playlist";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";

export const dailyCategoryKeys = {
  all: ["playlist", "daily-category"] as const,
  configs: (accountId: number | string) =>
    [...dailyCategoryKeys.all, String(accountId), "configs"] as const,
  songs: (accountId: number | string, date: string) =>
    [...dailyCategoryKeys.all, String(accountId), "songs", date] as const,
};

export function useDailyCategoryConfigs(accountId: number | string, enabled = true) {
  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryKey: dailyCategoryKeys.configs(accountId),
    queryFn: async () => {
      const data = (await getDailyCategoryConfigs()).data.data;
      if (!Array.isArray(data?.categorys)) throw new Error("Invalid daily category configuration.");
      return data.categorys;
    },
    throwOnError: throwQueryErrorWithoutData,
  });
}

export function useDailyCategorySongs(accountId: number | string, date: string, enabled = true) {
  return useQuery({
    enabled,
    meta: { scope: "account" },
    queryKey: dailyCategoryKeys.songs(accountId, date),
    queryFn: async () => {
      const data = (await getDailyCategorySongs()).data.data;
      if (!Array.isArray(data?.dailySongs) || !data.tags || !Array.isArray(data.tags.tagVOList))
        throw new Error("Invalid daily category songs.");
      return data;
    },
    throwOnError: throwQueryErrorWithoutData,
  });
}

export function useUpdateDailyCategoryConfig(accountId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { operation: "playlist.daily_category.update" },
    mutationFn: async (update: Parameters<typeof setDailyCategoryConfig>[0]) =>
      (await setDailyCategoryConfig(update)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...dailyCategoryKeys.all, String(accountId)] }),
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { getBanners } from "@/lib/api/banner";
import { musicQueryKeys } from "@/lib/query/queryKeys";

export function useHomeBanners() {
  return useQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () =>
      (await getBanners()).data.banners.filter((banner) => Boolean(banner.imageUrl ?? banner.pic)),
    queryKey: musicQueryKeys.home.banners(),
    staleTime: 30 * 60 * 1000,
  });
}

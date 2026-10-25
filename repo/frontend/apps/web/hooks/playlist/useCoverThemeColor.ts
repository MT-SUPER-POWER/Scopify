"use client";

import { useQuery } from "@tanstack/react-query";
import { getMainColorFromImage } from "@/lib/web/imageColor";

/** Key results by cover so a late response cannot recolor a newer cover. */
export function useCoverThemeColor(cover: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["cover-theme-color", cover],
    queryFn: () => (cover ? getMainColorFromImage(cover) : Promise.resolve("")),
    enabled: Boolean(cover),
    staleTime: Infinity,
    gcTime: 10 * 60 * 1_000,
  });
  return data || null;
}

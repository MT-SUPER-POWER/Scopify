"use client";

import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  loadAutomaticLyricSegmentation,
  loadLyricSegmentationOverrides,
  saveAutomaticLyricSegmentation,
  saveLyricSegmentationOverride,
} from "@/lib/lyrics/segmentationStorage";

const preferenceKey = ["lyrics", "local-word-segmentation"] as const;
const overridesKey = (trackId: string | null) => ["lyrics", "word-segmentation", trackId] as const;

export function useLyricSegmentation(trackId: string | null, enabled = true) {
  const automatic = useQuery({
    queryKey: preferenceKey,
    queryFn: loadAutomaticLyricSegmentation,
    networkMode: "always",
    enabled,
  });
  const overrides = useQuery({
    queryKey: overridesKey(trackId),
    queryFn: trackId === null ? skipToken : () => loadLyricSegmentationOverrides(trackId),
    networkMode: "always",
    enabled: enabled && trackId !== null,
  });
  return { automatic, overrides };
}

export function useSaveLyricSegmentation() {
  const queryClient = useQueryClient();
  const saveAutomatic = useMutation({
    mutationFn: saveAutomaticLyricSegmentation,
    networkMode: "always",
    onSuccess: (_, enabled) => {
      queryClient.setQueryData(preferenceKey, enabled);
    },
  });
  const saveOverride = useMutation({
    mutationFn: saveLyricSegmentationOverride,
    networkMode: "always",
    onSuccess: (overrides, { trackId }) => {
      queryClient.setQueryData(overridesKey(trackId), overrides);
    },
  });
  return { saveAutomatic, saveOverride };
}

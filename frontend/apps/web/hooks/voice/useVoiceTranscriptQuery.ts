"use client";

import { useQuery } from "@tanstack/react-query";

import { getVoiceLyricDocument } from "@/lib/lyrics/voiceLyric";
import { musicQueryKeys } from "@/lib/query/queryKeys";

export function useVoiceTranscriptQuery(voiceId: null | number, enabled = true) {
  return useQuery({
    enabled: enabled && voiceId !== null,
    meta: { persist: true, scope: "public" },
    queryFn: () => {
      if (voiceId === null) throw new Error("A voice ID is required to load its transcript.");
      return getVoiceLyricDocument(voiceId);
    },
    queryKey: musicQueryKeys.voice.transcript(voiceId ?? 0),
  });
}

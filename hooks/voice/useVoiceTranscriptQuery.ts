"use client";

import { useQuery } from "@tanstack/react-query";

import { getVoiceLyric } from "@/lib/api/voicelist";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { VoiceLyricDocument } from "@/types/api/voicelist";

function isSupportedLyricUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function getVoiceTranscript(voiceId: number): Promise<VoiceLyricDocument | null> {
  const lyricResponse = await getVoiceLyric(voiceId);
  const lyricUrl = lyricResponse.data.data?.lyricUrl;
  if (!lyricUrl || !isSupportedLyricUrl(lyricUrl)) return null;

  const response = await fetch(lyricUrl);
  if (!response.ok) throw new Error("Unable to fetch the voice transcript.");
  return response.json() as Promise<VoiceLyricDocument>;
}

export function useVoiceTranscriptQuery(voiceId: null | number, enabled = true) {
  return useQuery({
    enabled: enabled && voiceId !== null,
    meta: { persist: true, scope: "public" },
    queryFn: () => {
      if (voiceId === null) throw new Error("A voice ID is required to load its transcript.");
      return getVoiceTranscript(voiceId);
    },
    queryKey: musicQueryKeys.voice.transcript(voiceId ?? 0),
  });
}

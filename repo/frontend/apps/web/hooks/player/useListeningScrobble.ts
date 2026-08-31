"use client";

import { useEffect } from "react";

import { scrobbleV1 } from "@/lib/api/scrobble";
import {
  createListeningScrobbleRequest,
  getTrackedListeningDelta,
} from "@/lib/player/listeningScrobble";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import type { UseListeningScrobbleOptions } from "@/types/listeningScrobble";

/** Uploads one meaningful listening session without counting manual seeks as listening time. */
export function useListeningScrobble({ audioRef, session }: UseListeningScrobbleOptions) {
  const isLoggedIn = useLoginStatus();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoggedIn || !session) return;

    let hasSubmitted = false;
    let lastPositionSeconds: number | null = null;
    let listenedSeconds = 0;

    const recordProgress = () => {
      const currentPositionSeconds = audio.currentTime;
      if (!Number.isFinite(currentPositionSeconds) || currentPositionSeconds < 0) return;
      if (lastPositionSeconds !== null) {
        listenedSeconds += getTrackedListeningDelta(lastPositionSeconds, currentPositionSeconds);
      }
      lastPositionSeconds = currentPositionSeconds;
    };

    const beginProgress = () => {
      lastPositionSeconds = Number.isFinite(audio.currentTime) ? audio.currentTime : null;
    };

    const submit = () => {
      if (hasSubmitted) return;
      recordProgress();
      const request = createListeningScrobbleRequest(session, listenedSeconds);
      if (!request) return;

      hasSubmitted = true;
      void scrobbleV1(request).catch((error: unknown) => {
        console.warn("[player] Failed to upload listening record", {
          error: error instanceof Error ? error.message : "Unknown error",
          songId: session.songId,
        });
      });
    };

    const handleTimeUpdate = () => {
      if (!audio.paused) recordProgress();
    };
    const handleSeek = () => beginProgress();

    audio.addEventListener("ended", submit);
    audio.addEventListener("pause", recordProgress);
    audio.addEventListener("playing", beginProgress);
    audio.addEventListener("seeked", handleSeek);
    audio.addEventListener("seeking", handleSeek);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    window.addEventListener("pagehide", submit);

    return () => {
      submit();
      audio.removeEventListener("ended", submit);
      audio.removeEventListener("pause", recordProgress);
      audio.removeEventListener("playing", beginProgress);
      audio.removeEventListener("seeked", handleSeek);
      audio.removeEventListener("seeking", handleSeek);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      window.removeEventListener("pagehide", submit);
    };
  }, [audioRef, isLoggedIn, session]);
}

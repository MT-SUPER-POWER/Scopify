"use client";

import { useEffect } from "react";

import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import type { UseMediaSessionOptions } from "@/types/player";

const ARTWORK_SIZES = ["96x96", "128x128", "192x192", "256x256", "384x384", "512x512"] as const;

function buildArtwork(src: string | null | undefined): MediaImage[] {
  if (!src) return [];
  return ARTWORK_SIZES.map((sizes) => ({
    sizes,
    src,
    type: "image/jpeg",
  }));
}

/**
 * Bridges audio playback state, track metadata, and media control actions
 * with the browser Media Session API (and OS media transport controls like Windows SMTC).
 */
export function useMediaSession({
  audioRef,
  currentSongDetail,
  isPlaying,
}: UseMediaSessionOptions) {
  // Bind Action Handlers
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    const setActionHandlerSafely = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`[MediaSession] Failed to bind ${action} handler`, error);
      }
    };

    setActionHandlerSafely("play", () => {
      usePlayerStore.getState().setIsPlaying(true);
    });

    setActionHandlerSafely("pause", () => {
      usePlayerStore.getState().setIsPlaying(false);
    });

    setActionHandlerSafely("previoustrack", () => {
      void usePlayerStore.getState().playPrev();
    });

    setActionHandlerSafely("nexttrack", () => {
      void usePersonalFmStore.getState().advance();
    });

    setActionHandlerSafely("stop", () => {
      usePlayerStore.getState().setIsPlaying(false);
    });

    setActionHandlerSafely("seekto", (details) => {
      if (details.seekTime != null && Number.isFinite(details.seekTime)) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = Math.max(0, details.seekTime);
        }
      }
    });

    setActionHandlerSafely("seekbackward", (details) => {
      const audio = audioRef.current;
      if (audio) {
        const offset = details.seekOffset ?? 10;
        audio.currentTime = Math.max(0, audio.currentTime - offset);
      }
    });

    setActionHandlerSafely("seekforward", (details) => {
      const audio = audioRef.current;
      if (audio) {
        const offset = details.seekOffset ?? 10;
        audio.currentTime = Math.min(
          audio.duration || Number.POSITIVE_INFINITY,
          audio.currentTime + offset,
        );
      }
    });

    return () => {
      setActionHandlerSafely("play", null);
      setActionHandlerSafely("pause", null);
      setActionHandlerSafely("previoustrack", null);
      setActionHandlerSafely("nexttrack", null);
      setActionHandlerSafely("stop", null);
      setActionHandlerSafely("seekto", null);
      setActionHandlerSafely("seekbackward", null);
      setActionHandlerSafely("seekforward", null);
    };
  }, [audioRef]);

  // Update Media Metadata
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    if (!currentSongDetail) {
      try {
        mediaSession.metadata = null;
      } catch (error) {
        console.warn("[MediaSession] Failed to clear metadata", error);
      }
      return;
    }

    const artistName =
      currentSongDetail.ar
        ?.map((artist) => artist.name)
        .filter(Boolean)
        .join(" / ") || "未知歌手";
    const albumName = currentSongDetail.al?.name || "";
    const coverUrl = currentSongDetail.al?.picUrl || "";

    try {
      mediaSession.metadata = new MediaMetadata({
        album: albumName,
        artist: artistName,
        artwork: buildArtwork(coverUrl),
        title: currentSongDetail.name || "未知曲目",
      });
    } catch (error) {
      console.warn("[MediaSession] Failed to update metadata", error);
    }
  }, [currentSongDetail]);

  // Update Playback State
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    try {
      navigator.mediaSession.playbackState = currentSongDetail
        ? isPlaying
          ? "playing"
          : "paused"
        : "none";
    } catch (error) {
      console.warn("[MediaSession] Failed to update playback state", error);
    }
  }, [currentSongDetail, isPlaying]);

  // Update Position State
  useEffect(() => {
    const audio = audioRef.current;
    if (
      !audio ||
      typeof window === "undefined" ||
      !("mediaSession" in navigator) ||
      !("setPositionState" in navigator.mediaSession)
    ) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    const updatePosition = () => {
      if (!currentSongDetail) return;
      const durationSec =
        (currentSongDetail.dt ? currentSongDetail.dt / 1_000 : audio.duration) || 0;
      const positionSec = audio.currentTime || 0;

      if (durationSec > 0 && Number.isFinite(durationSec) && positionSec <= durationSec) {
        try {
          mediaSession.setPositionState({
            duration: durationSec,
            playbackRate: audio.playbackRate || 1,
            position: Math.max(0, Math.min(positionSec, durationSec)),
          });
        } catch {
          // Ignore transient out-of-range position errors
        }
      }
    };

    updatePosition();

    audio.addEventListener("timeupdate", updatePosition);
    audio.addEventListener("durationchange", updatePosition);
    audio.addEventListener("ratechange", updatePosition);
    audio.addEventListener("seeked", updatePosition);

    return () => {
      audio.removeEventListener("timeupdate", updatePosition);
      audio.removeEventListener("durationchange", updatePosition);
      audio.removeEventListener("ratechange", updatePosition);
      audio.removeEventListener("seeked", updatePosition);
    };
  }, [audioRef, currentSongDetail]);
}

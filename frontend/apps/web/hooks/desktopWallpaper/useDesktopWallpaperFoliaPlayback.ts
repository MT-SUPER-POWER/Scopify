"use client";

import { useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DesktopPlaybackWallpaperAudioFrame } from "@scopify/desktop-contract";

import type { AudioBands } from "@/components/lyrics/folia/src/types";
import { usePlaybackPositionMs, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";
import { runtime } from "@/lib/runtime";
import type {
  DesktopWallpaperAudioMotionValues,
  DesktopWallpaperFoliaPlaybackState,
} from "@/types/desktopPlaybackWallpaper";
import type { LyricData } from "@/types/lyrics";

const DESKTOP_WALLPAPER_AUDIO_STALE_MS = 500;

export function useDesktopWallpaperFoliaPlayback(
  lyricOffsetMs: number,
): DesktopWallpaperFoliaPlaybackState {
  const [model, setModel] = useState<DesktopWallpaperFoliaPlaybackState["model"]>(null);
  const projection = usePlaybackProjection<LyricData>();
  const positionMs = usePlaybackPositionMs();
  const latestAudioSampleRef = useRef(-1);
  const audioResetTimerRef = useRef<number | null>(null);
  const currentTime = useMotionValue(0);
  const lyricCurrentTime = useMotionValue(0);
  const audioPower = useMotionValue(0);
  const bass = useMotionValue(0);
  const lowMid = useMotionValue(0);
  const mid = useMotionValue(0);
  const vocal = useMotionValue(0);
  const treble = useMotionValue(0);
  const spectrum = useMotionValue(new Uint8Array(new ArrayBuffer(0)));
  const lyrics = useMemo(
    () => (projection.lyrics ? adaptLyricDataToFolia(projection.lyrics, []) : null),
    [projection.lyrics],
  );
  const effectiveLyricTimeSeconds = positionMs / 1_000 - lyricOffsetMs / 1_000;
  const currentLineIndex = lyrics
    ? findLatestActiveFoliaLineIndex(lyrics.lines, effectiveLyricTimeSeconds)
    : -1;
  const audioBands = useMemo<AudioBands>(
    () => ({ bass, lowMid, mid, spectrum, treble, vocal }),
    [bass, lowMid, mid, spectrum, treble, vocal],
  );
  const track = useMemo(
    () =>
      projection.track
        ? {
            ...projection.track,
            durationMs: projection.durationMs,
          }
        : null,
    [projection.durationMs, projection.track],
  );

  useEffect(() => {
    let modelEventReceived = false;
    let disposed = false;
    const stopModelSubscription = runtime.desktopPlaybackWallpaper.onModelChanged((nextModel) => {
      modelEventReceived = true;
      if (!disposed) setModel(nextModel);
    });
    const stopAudioSubscription = runtime.desktopPlaybackWallpaper.onAudioFrame((frame) => {
      if (disposed || frame.sampledAt < latestAudioSampleRef.current) return;
      latestAudioSampleRef.current = frame.sampledAt;
      applyAudioFrame(frame, { audioPower, bass, lowMid, mid, spectrum, treble, vocal });
      if (audioResetTimerRef.current !== null) {
        window.clearTimeout(audioResetTimerRef.current);
      }
      audioResetTimerRef.current = window.setTimeout(() => {
        resetAudioFrame({ audioPower, bass, lowMid, mid, spectrum, treble, vocal });
        audioResetTimerRef.current = null;
      }, DESKTOP_WALLPAPER_AUDIO_STALE_MS);
    });

    void runtime.desktopPlaybackWallpaper.getModel().then((initialModel) => {
      if (!disposed && !modelEventReceived) setModel(initialModel);
    });

    return () => {
      disposed = true;
      if (audioResetTimerRef.current !== null) {
        window.clearTimeout(audioResetTimerRef.current);
        audioResetTimerRef.current = null;
      }
      stopAudioSubscription();
      stopModelSubscription();
    };
  }, [audioPower, bass, lowMid, mid, spectrum, treble, vocal]);

  useEffect(() => {
    currentTime.set(positionMs / 1_000);
    lyricCurrentTime.set(effectiveLyricTimeSeconds);
  }, [currentTime, effectiveLyricTimeSeconds, lyricCurrentTime, positionMs]);

  return {
    bridge: {
      audioBands,
      audioPower,
      currentLineIndex,
      currentTime,
      durationSeconds: projection.durationMs / 1_000,
      isPlaying: projection.connection === "connected" && projection.isPlaying,
      lines: lyrics?.lines ?? [],
      lyricCurrentTime,
      lyrics,
    },
    model,
    positionMs,
    projection,
    track,
  };
}

function applyAudioFrame(
  frame: DesktopPlaybackWallpaperAudioFrame,
  values: DesktopWallpaperAudioMotionValues,
) {
  values.audioPower.set(frame.power);
  values.bass.set(frame.bass);
  values.lowMid.set(frame.lowMid);
  values.mid.set(frame.mid);
  values.spectrum.set(Uint8Array.from(frame.spectrum));
  values.treble.set(frame.treble);
  values.vocal.set(frame.vocal);
}

function resetAudioFrame(values: DesktopWallpaperAudioMotionValues) {
  values.audioPower.set(0);
  values.bass.set(0);
  values.lowMid.set(0);
  values.mid.set(0);
  values.spectrum.set(new Uint8Array(new ArrayBuffer(0)));
  values.treble.set(0);
  values.vocal.set(0);
}

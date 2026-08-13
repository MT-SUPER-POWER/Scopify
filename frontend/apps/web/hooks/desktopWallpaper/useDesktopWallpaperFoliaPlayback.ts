"use client";

import { useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AudioBands } from "@/components/lyrics/folia/src/types";
import { usePlaybackPositionMs, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import {
  AudioFeatureRuntime,
  type AudioFeatureValues,
} from "@/lib/desktopPlaybackWallpaper/audioFeatureRuntime";
import { createAudioFeatureSubscriberConnection } from "@/lib/desktopPlaybackWallpaper/subscriberConnection";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";
import { runtime } from "@/lib/runtime";
import type {
  DesktopWallpaperAudioMotionValues,
  DesktopWallpaperFoliaPlaybackState,
} from "@/types/desktopPlaybackWallpaper";
import type { LyricData } from "@/types/lyrics";

export function useDesktopWallpaperFoliaPlayback(
  lyricOffsetMs: number,
): DesktopWallpaperFoliaPlaybackState {
  const [model, setModel] = useState<DesktopWallpaperFoliaPlaybackState["model"]>(null);
  const projection = usePlaybackProjection<LyricData>();
  const positionMs = usePlaybackPositionMs();
  const audioFeatureRuntimeRef = useRef<AudioFeatureRuntime | null>(null);
  const audioFeatureConnectionIdRef = useRef<string | null>(null);
  const currentTime = useMotionValue(0);
  const lyricCurrentTime = useMotionValue(0);
  const audioPower = useMotionValue(0);
  const bass = useMotionValue(0);
  const lowMid = useMotionValue(0);
  const mid = useMotionValue(0);
  const vocal = useMotionValue(0);
  const treble = useMotionValue(0);
  const spectrum = useMotionValue(new Uint8Array(new ArrayBuffer(0)));
  if (audioFeatureRuntimeRef.current === null) {
    audioFeatureRuntimeRef.current = new AudioFeatureRuntime();
  }
  if (audioFeatureConnectionIdRef.current === null) {
    audioFeatureConnectionIdRef.current = createAudioFeatureConnectionId();
  }
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
    const audioFeatureRuntime = audioFeatureRuntimeRef.current!;
    const applyAudioValues = (values: AudioFeatureValues) => {
      applyAudioValuesToMotionValues(values, {
        audioPower,
        bass,
        lowMid,
        mid,
        spectrum,
        treble,
        vocal,
      });
    };
    audioFeatureRuntime.start(applyAudioValues);
    const audioFeatureSubscriber = createAudioFeatureSubscriberConnection({
      connectionId: audioFeatureConnectionIdRef.current!,
      onFrame: (frame) => {
        if (!disposed) audioFeatureRuntime.accept(frame, performance.now());
      },
      port: runtime.audioFeature,
    });
    audioFeatureSubscriber.start();

    void runtime.desktopPlaybackWallpaper.getModel().then((initialModel) => {
      if (!disposed && !modelEventReceived) setModel(initialModel);
    });

    return () => {
      disposed = true;
      audioFeatureSubscriber.stop();
      stopModelSubscription();
      audioFeatureRuntime.stop();
    };
  }, [audioPower, bass, lowMid, mid, spectrum, treble, vocal]);

  useEffect(() => {
    audioFeatureRuntimeRef.current?.setExpectedIdentity({
      authorityId: projection.authorityId,
      sessionId: projection.sessionId,
    });
  }, [projection.authorityId, projection.sessionId]);

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

function applyAudioValuesToMotionValues(
  frame: AudioFeatureValues,
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

function createAudioFeatureConnectionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `desktop-wallpaper:${crypto.randomUUID()}`;
  }
  return `desktop-wallpaper:${Math.random().toString(36).slice(2)}`;
}

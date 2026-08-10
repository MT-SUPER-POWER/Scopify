"use client";

import { useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DesktopPlaybackWallpaperAudioFrame } from "@scopify/desktop-contract";

import type { AudioBands } from "@/components/lyrics/folia/src/types";
import {
  DESKTOP_WALLPAPER_PRESENTATION_STALE_MS,
  getDesktopWallpaperPlaybackTimeMs,
} from "@/lib/desktopPlaybackWallpaper/playback";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";
import { runtime } from "@/lib/runtime";
import type { DesktopLyricSnapshot } from "@/types/desktopLyric";
import type {
  DesktopWallpaperAudioMotionValues,
  DesktopWallpaperFoliaPlaybackState,
} from "@/types/desktopPlaybackWallpaper";

const DESKTOP_WALLPAPER_AUDIO_STALE_MS = 500;

export function useDesktopWallpaperFoliaPlayback(
  lyricOffsetMs: number,
): DesktopWallpaperFoliaPlaybackState {
  const [model, setModel] = useState<DesktopWallpaperFoliaPlaybackState["model"]>(null);
  const [presentation, setPresentation] = useState<DesktopLyricSnapshot | null>(null);
  const [feedIsLive, setFeedIsLive] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const presentationRef = useRef<DesktopLyricSnapshot | null>(null);
  const currentLineIndexRef = useRef(-1);
  const latestAudioSampleRef = useRef(-1);
  const lastAudioFrameReceivedAtRef = useRef(0);
  const audioWasResetRef = useRef(true);
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
    () => (presentation?.lyrics ? adaptLyricDataToFolia(presentation.lyrics, []) : null),
    [presentation?.lyrics],
  );
  const audioBands = useMemo<AudioBands>(
    () => ({ bass, lowMid, mid, spectrum, treble, vocal }),
    [bass, lowMid, mid, spectrum, treble, vocal],
  );

  useEffect(() => {
    let modelEventReceived = false;
    let disposed = false;
    const acceptPresentation = (nextPresentation: DesktopLyricSnapshot) => {
      if (disposed) return;
      setPresentation((current) =>
        !current || nextPresentation.updatedAt >= current.updatedAt ? nextPresentation : current,
      );
    };
    const stopModelSubscription = runtime.desktopPlaybackWallpaper.onModelChanged((nextModel) => {
      modelEventReceived = true;
      if (!disposed) setModel(nextModel);
    });
    const stopPresentationSubscription =
      runtime.desktopPlaybackWallpaper.onPresentationChanged(acceptPresentation);
    const stopAudioSubscription = runtime.desktopPlaybackWallpaper.onAudioFrame((frame) => {
      if (disposed || frame.sampledAt < latestAudioSampleRef.current) return;
      latestAudioSampleRef.current = frame.sampledAt;
      lastAudioFrameReceivedAtRef.current = Date.now();
      audioWasResetRef.current = false;
      applyAudioFrame(frame, { audioPower, bass, lowMid, mid, spectrum, treble, vocal });
    });

    void runtime.desktopPlaybackWallpaper.getModel().then((initialModel) => {
      if (!disposed && !modelEventReceived) setModel(initialModel);
    });
    void runtime.desktopPlaybackWallpaper.getPresentation().then((initialPresentation) => {
      if (initialPresentation) acceptPresentation(initialPresentation);
    });

    return () => {
      disposed = true;
      stopAudioSubscription();
      stopModelSubscription();
      stopPresentationSubscription();
    };
  }, [audioPower, bass, lowMid, mid, spectrum, treble, vocal]);

  useEffect(() => {
    presentationRef.current = presentation;
    if (!presentation?.isPlaying) {
      setFeedIsLive(false);
      return;
    }

    const remainingLiveTime = Math.max(
      0,
      DESKTOP_WALLPAPER_PRESENTATION_STALE_MS - (Date.now() - presentation.updatedAt),
    );
    setFeedIsLive(remainingLiveTime > 0);
    const timeout = window.setTimeout(() => setFeedIsLive(false), remainingLiveTime);
    return () => window.clearTimeout(timeout);
  }, [presentation]);

  useEffect(() => {
    let animationFrame = 0;
    const tick = () => {
      const now = Date.now();
      const nextTimeSeconds =
        getDesktopWallpaperPlaybackTimeMs(presentationRef.current, now) / 1_000;
      const effectiveLyricTime = nextTimeSeconds - lyricOffsetMs / 1_000;
      currentTime.set(nextTimeSeconds);
      lyricCurrentTime.set(effectiveLyricTime);

      const nextLineIndex = lyrics
        ? findLatestActiveFoliaLineIndex(lyrics.lines, effectiveLyricTime)
        : -1;
      if (nextLineIndex !== currentLineIndexRef.current) {
        currentLineIndexRef.current = nextLineIndex;
        setCurrentLineIndex(nextLineIndex);
      }

      if (
        !audioWasResetRef.current &&
        now - lastAudioFrameReceivedAtRef.current > DESKTOP_WALLPAPER_AUDIO_STALE_MS
      ) {
        resetAudioFrame({ audioPower, bass, lowMid, mid, spectrum, treble, vocal });
        audioWasResetRef.current = true;
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    audioPower,
    bass,
    currentTime,
    lowMid,
    lyricCurrentTime,
    lyricOffsetMs,
    lyrics,
    mid,
    spectrum,
    treble,
    vocal,
  ]);

  const runtimeIsActive = model?.status.state === "running" || model?.status.state === "starting";
  return {
    bridge: {
      audioBands,
      audioPower,
      currentLineIndex,
      currentTime,
      durationSeconds: (presentation?.track?.durationMs ?? 0) / 1_000,
      isPlaying: Boolean(runtimeIsActive && presentation?.isPlaying && feedIsLive),
      lines: lyrics?.lines ?? [],
      lyricCurrentTime,
      lyrics,
    },
    model,
    presentation,
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

"use client";

import { type MutableRefObject, useEffect, useRef } from "react";

import {
  applyAudioEqualizerSettings,
  connectAudioEqualizerGraph,
} from "@/lib/player/audioEqualizerGraph";
import {
  createAnalyserAudioFeatureSource,
  type AudioFeatureSource,
  registerAudioFeatureSource,
} from "@/lib/audioFeature/source";
import { runtime } from "@/lib/runtime";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import type { LyricAudioBands } from "@/types/lyrics";

interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Folia media analyser bridge. It retains Scopify's audio element and
 * broadcasts the upstream frequency bands for the playback stage.
 */
export function useAudioVisualizer(audioRef: MutableRefObject<HTMLAudioElement | null>) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const equalizerFiltersRef = useRef<BiquadFilterNode[]>([]);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const equalizerSettings = useAudioEqualizerStore((state) => state.settings);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === "undefined") return;

    let animationFrame = 0;
    let analyser = analyserRef.current;
    let didFail = false;
    let audioFeatureSource: AudioFeatureSource | null = null;
    let unregisterAudioFeatureSource: (() => void) | undefined;
    const shouldBroadcastFoliaBands = runtime.playbackHost.getNonce() === null;

    const broadcast = (bands: LyricAudioBands) => {
      window.dispatchEvent(
        new CustomEvent<LyricAudioBands>("player-audio-bands", { detail: bands }),
      );
    };

    const prepare = () => {
      if (analyser || didFail) return;
      try {
        const AudioContextClass =
          window.AudioContext || (window as AudioContextWindow).webkitAudioContext;
        if (!AudioContextClass) throw new Error("Web Audio API is unavailable");
        const context = contextRef.current ?? new AudioContextClass();
        contextRef.current = context;
        const source = mediaSourceRef.current ?? context.createMediaElementSource(audio);
        mediaSourceRef.current = source;
        if (!analyser) {
          analyser = context.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.6;
          equalizerFiltersRef.current = connectAudioEqualizerGraph(
            context,
            source,
            analyser,
            useAudioEqualizerStore.getState().settings,
          );
          analyser.connect(context.destination);
          analyserRef.current = analyser;
          audioFeatureSource = createAnalyserAudioFeatureSource({
            analyser,
            isPaused: () => audio.paused,
          });
          unregisterAudioFeatureSource = registerAudioFeatureSource(audioFeatureSource);
        }
      } catch (error) {
        didFail = true;
        console.warn("[lyrics] audio analyser is unavailable", error);
      }
    };

    const onPlay = () => {
      prepare();
      void contextRef.current?.resume();
    };

    const tick = () => {
      const bands = audioFeatureSource?.readBands();
      if (!bands) {
        const breath = (Math.sin(Date.now() / 2_000) + 1) * 20;
        broadcast({
          bass: breath,
          lowMid: breath,
          mid: breath,
          power: breath,
          spectrum: [],
          treble: breath,
          vocal: breath,
        });
      } else {
        broadcast(bands);
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    audio.addEventListener("play", onPlay);
    if (!audio.paused) onPlay();
    if (shouldBroadcastFoliaBands) animationFrame = window.requestAnimationFrame(tick);
    return () => {
      audio.removeEventListener("play", onPlay);
      window.cancelAnimationFrame(animationFrame);
      unregisterAudioFeatureSource?.();
    };
  }, [audioRef]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context || equalizerFiltersRef.current.length === 0) return;
    applyAudioEqualizerSettings(context, equalizerFiltersRef.current, equalizerSettings);
  }, [equalizerSettings]);
}

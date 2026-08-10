"use client";

import { type MutableRefObject, useEffect, useRef } from "react";

import {
  applyAudioEqualizerSettings,
  connectAudioEqualizerGraph,
} from "@/lib/player/audioEqualizerGraph";
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
      if (!analyser || audio.paused) {
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
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        const bass = averageFrequencyRange(frequencyData, 20, 150);
        const lowMid = averageFrequencyRange(frequencyData, 150, 400);
        broadcast({
          bass: emphasize(bass, 1.8),
          lowMid: emphasize(lowMid, 2),
          mid: emphasize(averageFrequencyRange(frequencyData, 400, 1200), 2),
          power: emphasize((bass + lowMid) / 2, 3),
          spectrum: Array.from(frequencyData),
          treble: emphasize(averageFrequencyRange(frequencyData, 3500, 12000), 2),
          vocal: emphasize(averageFrequencyRange(frequencyData, 1000, 3500), 1.5),
        });
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    audio.addEventListener("play", onPlay);
    if (!audio.paused) onPlay();
    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      audio.removeEventListener("play", onPlay);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [audioRef]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context || equalizerFiltersRef.current.length === 0) return;
    applyAudioEqualizerSettings(context, equalizerFiltersRef.current, equalizerSettings);
  }, [equalizerSettings]);
}

function averageFrequencyRange(data: Uint8Array, minimumHz: number, maximumHz: number): number {
  const start = Math.floor(minimumHz / 21.5);
  const end = Math.min(data.length - 1, Math.floor(maximumHz / 21.5));
  let total = 0;
  for (let index = start; index <= end; index += 1) total += data[index] ?? 0;
  return end >= start ? total / (end - start + 1) : 0;
}

function emphasize(value: number, boost: number): number {
  return Math.pow(value / 255, boost) * 255;
}

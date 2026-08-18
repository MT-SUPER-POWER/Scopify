"use client";

import { type MutableRefObject, useEffect, useRef } from "react";

import {
  applyAudioEqualizerSettings,
  connectAudioEqualizerGraph,
  type AudioEqualizerGraph,
} from "@/lib/player/audioEqualizerGraph";
import { DEFAULT_AUDIO_EFFECT_SETTINGS } from "@/constants/audioEqualizer";
import {
  connectAudioPostEffectsGraph,
  type AudioPostEffectsGraph,
} from "@/lib/player/audioPostEffectsGraph";
import {
  createAnalyserAudioFeatureSource,
  registerAudioFeatureSource,
} from "@/lib/audioFeature/source";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { usePlayerStore } from "@/store/module/player";
import type { AudioFeatureSource } from "@/types/audioFeaturePublisher";
import type { LyricAudioBands } from "@/types/lyrics";
import type { SongDetail } from "@/types/api/music";
import type { ReplayGainMode } from "@/types/player";

interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function resolveReplayGainRatio(song: SongDetail | null, mode: ReplayGainMode) {
  if (!song || mode === "off") return 1;
  const gainDb =
    mode === "album" ? song.replayGainAlbumGain : (song.replayGainTrackGain ?? song.replayGain);
  const peak = mode === "album" ? song.replayGainAlbumPeak : song.replayGainTrackPeak;
  if (gainDb == null || !Number.isFinite(gainDb)) return 1;
  const ratio = 10 ** (Math.max(-24, Math.min(24, gainDb)) / 20);
  return peak && peak > 0 ? Math.min(ratio, 1 / peak) : ratio;
}

/**
 * Folia media analyser bridge. It retains Scopify's audio element and
 * broadcasts the upstream frequency bands for the playback stage.
 */
export function useAudioVisualizer(audioRef: MutableRefObject<HTMLAudioElement | null>) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const equalizerGraphRef = useRef<AudioEqualizerGraph | null>(null);
  const postEffectsRef = useRef<AudioPostEffectsGraph | null>(null);
  const replayGainNodeRef = useRef<GainNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const equalizerSettings = useAudioEqualizerStore((state) => state.settings);
  const replayGainMode = usePlayerStore((state) => state.replayGainMode);
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === "undefined") return;

    let animationFrame = 0;
    let analyser = analyserRef.current;
    let didFail = false;
    let audioFeatureSource: AudioFeatureSource | null = null;
    let unregisterAudioFeatureSource: (() => void) | undefined;

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
          const replayGainNode = context.createGain();
          replayGainNode.gain.value = resolveReplayGainRatio(
            usePlayerStore.getState().currentSongDetail,
            usePlayerStore.getState().replayGainMode,
          );
          source.connect(replayGainNode);
          replayGainNodeRef.current = replayGainNode;
          analyser = context.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.6;
          postEffectsRef.current = connectAudioPostEffectsGraph(
            context,
            analyser,
            useAudioEqualizerStore.getState().settings.enabled
              ? useAudioEqualizerStore.getState().settings.effects
              : DEFAULT_AUDIO_EFFECT_SETTINGS,
          );
          equalizerGraphRef.current = connectAudioEqualizerGraph(
            context,
            replayGainNode,
            postEffectsRef.current.input,
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
    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      audio.removeEventListener("play", onPlay);
      window.cancelAnimationFrame(animationFrame);
      unregisterAudioFeatureSource?.();
    };
  }, [audioRef]);

  useEffect(() => {
    const context = contextRef.current;
    const graph = equalizerGraphRef.current;
    if (!context || !graph) return;
    applyAudioEqualizerSettings(context, graph, equalizerSettings);
    postEffectsRef.current?.apply(
      equalizerSettings.enabled ? equalizerSettings.effects : DEFAULT_AUDIO_EFFECT_SETTINGS,
    );
  }, [equalizerSettings]);

  useEffect(() => {
    const context = contextRef.current;
    const gainNode = replayGainNodeRef.current;
    if (!context || !gainNode) return;
    const ratio = resolveReplayGainRatio(currentSongDetail, replayGainMode);
    gainNode.gain.cancelScheduledValues(context.currentTime);
    gainNode.gain.setTargetAtTime(ratio, context.currentTime, 0.02);
  }, [currentSongDetail, replayGainMode]);
}

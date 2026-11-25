"use client";

import { useEffect, type RefObject } from "react";

import { hasStemMixerPlatform } from "@/lib/player/stemMixer/availability";
import { useStemMixerStore } from "@/store/module/stemMixer";
import type { StemMixerAudioGraph } from "@/types/audio/stemMixer";

export function useStemMixer(
  audioRef: RefObject<HTMLAudioElement | null>,
  contextRef: RefObject<AudioContext | null>,
  graphRef: RefObject<StemMixerAudioGraph | null>,
) {
  const enabled = useStemMixerStore((state) => state.enabled);
  const block = useStemMixerStore((state) => state.block);

  useEffect(() => {
    const { setPhase } = useStemMixerStore.getState();
    if (!enabled) {
      setPhase("off");
      return;
    }
    if (block || !hasStemMixerPlatform()) return;
    setPhase("waiting");
    const lifetime = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const audio = audioRef.current;
      const context = contextRef.current;
      const graph = graphRef.current;
      if (!audio || !context || !graph) {
        timer = setTimeout(connect, 500);
        return;
      }
      void import("@/lib/player/stemMixer/playback")
        .then(({ startStemMixer }) => {
          if (!lifetime.signal.aborted)
            return startStemMixer(audio, context, graph, lifetime.signal);
        })
        .catch((error: unknown) => {
          if (lifetime.signal.aborted) return;
          setPhase("failed");
          console.warn("[StemMixer] Could not start the playback mixer", error);
        });
    };
    connect();

    return () => {
      lifetime.abort();
      clearTimeout(timer);
    };
  }, [audioRef, block, contextRef, enabled, graphRef]);
}

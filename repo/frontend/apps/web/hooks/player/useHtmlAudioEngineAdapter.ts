"use client";

import { useEffect, useState, type MutableRefObject } from "react";

import { createHtmlAudioEngineAdapter } from "@/lib/player/adapters/htmlAudioEngineAdapter";
import type { HtmlAudioEngineAdapter } from "@/types/playbackAdapters";

/**
 * Creates the renderer's sole physical audio adapter after React mounts the
 * audio element. All ordinary source and media-event behaviour is routed
 * through this adapter; feature-specific consumers may still receive the ref.
 */
export function useHtmlAudioEngineAdapter(
  audioRef: MutableRefObject<HTMLAudioElement | null>,
): HtmlAudioEngineAdapter | null {
  const [adapter, setAdapter] = useState<HtmlAudioEngineAdapter | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextAdapter = createHtmlAudioEngineAdapter(audio);
    setAdapter(nextAdapter);
    return () => {
      setAdapter((current) => (current === nextAdapter ? null : current));
      void nextAdapter.dispose();
    };
  }, [audioRef]);

  return adapter;
}

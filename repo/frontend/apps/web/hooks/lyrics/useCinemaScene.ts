"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { CinemaRuntime, CinemaRuntimeStatus, CinemaSceneInputs } from "@/types/lyrics/cinema";

export function useCinemaScene(
  enabled: boolean,
  containerRef: RefObject<HTMLDivElement | null>,
  screenRef: RefObject<HTMLDivElement | null>,
  inputs: CinemaSceneInputs,
) {
  const latestInputs = useRef(inputs);
  const runtimeRef = useRef<CinemaRuntime | null>(null);
  const [status, setStatus] = useState<CinemaRuntimeStatus>("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    latestInputs.current = inputs;
  }, [inputs]);

  useEffect(() => {
    setStatus("idle");
    const container = containerRef.current;
    const screen = screenRef.current;
    if (!enabled || !container || !screen) return;

    const controller = new AbortController();
    const { signal } = controller;
    let frame = 0;
    let started = false;
    const stop = () => {
      controller.abort();
      cancelAnimationFrame(frame);
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
    };
    const fail = (error: unknown) => {
      if (signal.aborted) return;
      console.warn("[Cinema] Scene rendering failed", error);
      stop();
      setStatus("failed");
    };

    const start = async () => {
      const { createCinemaRuntime } = await import("@/lib/lyrics/cinema/createCinemaRuntime");
      if (signal.aborted) return;
      const runtime = await createCinemaRuntime(container, screen, signal, fail);
      if (!runtime) return;
      if (signal.aborted) {
        runtime.dispose();
        return;
      }
      runtimeRef.current = runtime;
      const draw = (now: number) => {
        if (signal.aborted) return;
        try {
          runtime.draw(now, latestInputs.current);
          if (!started) {
            started = true;
            setStatus("ready");
          }
          frame = requestAnimationFrame(draw);
        } catch (error) {
          fail(error);
        }
      };
      frame = requestAnimationFrame(draw);
    };

    void start().catch(fail);
    return stop;
  }, [attempt, containerRef, enabled, screenRef]);

  const turn = useCallback((yaw: number, pitch: number) => {
    runtimeRef.current?.turn(yaw, pitch);
  }, []);
  const retry = useCallback(() => {
    setStatus("idle");
    setAttempt((current) => current + 1);
  }, []);

  return { status, turn, retry };
}

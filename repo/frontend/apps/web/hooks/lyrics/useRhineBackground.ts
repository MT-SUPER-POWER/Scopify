"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_RHINE_BACKGROUND_TUNING, RHINE_LANES, RHINE_ROWS } from "@/constants/rhineBackground";
import { loadRhineModel, RhineModel } from "@/lib/lyrics/rhine/model";
import { RhineRenderer } from "@/lib/lyrics/rhine/renderer";
import { RhineScene } from "@/lib/lyrics/rhine/scene";
import type { RhineBackgroundProps, RhineLoadState, RhineSceneInput } from "@/types/rhineBackground";

function sceneInput(props: RhineBackgroundProps): RhineSceneInput {
  const tuning = { ...DEFAULT_RHINE_BACKGROUND_TUNING, ...props.config?.rhine?.tuning };
  return {
    tuning,
    seed: String(props.seed ?? "rhine"),
    track: { title: props.songTitle ?? "", coverUrl: props.coverUrl ?? null },
    frozen: props.paused || props.staticMode,
    dark: tuning.colorMode === "auto" ? !props.isDaylight : tuning.colorMode === "dark",
  };
}

export function useRhineBackground(props: RhineBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  const synchronize = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<RhineLoadState>("loading");
  const [attempt, setAttempt] = useState(0);

  useLayoutEffect(() => {
    latest.current = props;
    synchronize.current?.();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const controller = new AbortController();
    let scene: RhineScene | undefined;
    let model: RhineModel | undefined;
    let view: RhineRenderer | undefined;
    let request = 0;
    let previousTime: number | null = null;
    let visible = true;
    let failed = false;
    let width = container.clientWidth;
    let height = container.clientHeight;
    setStatus("loading");

    const stop = () => {
      cancelAnimationFrame(request); request = 0;
      previousTime = null;
    };
    const running = () => !controller.signal.aborted && !failed && visible && !document.hidden
      && width > 0 && height > 0 && !latest.current.paused && !latest.current.staticMode;
    const fail = (error: unknown) => {
      if (controller.signal.aborted || failed) return;
      failed = true; stop();
      console.warn("[RhineBackground] Scene unavailable", error);
      setStatus("error");
    };
    const tick = (now: number) => {
      request = 0;
      if (!scene || !running()) { previousTime = null; return; }
      const interval = 1000 / Number(sceneInput(latest.current).tuning.frameRate);
      if (previousTime === null) previousTime = now;
      const elapsed = now - previousTime;
      if (elapsed >= interval - 0.5) {
        previousTime = now;
        const { audioBands, audioPower } = latest.current;
        try {
          scene.advance(Math.min(elapsed / 1000, 0.1), {
            low: audioBands.bass.get(),
            mid: (audioBands.mid.get() + audioBands.vocal.get()) / 2,
            high: audioBands.treble.get(),
            activity: audioPower.get(),
          });
        } catch (error) { fail(error); return; }
      }
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (!scene || failed || controller.signal.aborted) return;
      try {
        if (scene.setInput(sceneInput(latest.current))) scene.paint();
      } catch (error) { fail(error); return; }
      if (!running()) stop();
      else if (!request) request = requestAnimationFrame(tick);
    };
    synchronize.current = sync;
    const resize = new ResizeObserver((entries) => {
      const size = entries[0]?.contentRect;
      if (!size) return;
      width = size.width; height = size.height;
      if (scene && !failed && width > 0 && height > 0) {
        try { scene.resize(width, height); }
        catch (error) { fail(error); }
      }
      sync();
    });
    resize.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    intersection.observe(container);
    document.addEventListener("visibilitychange", sync);
    const contextLost = (event: Event) => {
      event.preventDefault(); fail(new Error("WebGL context lost"));
    };
    canvas.addEventListener("webglcontextlost", contextLost);

    void (async () => {
      try {
        model = await loadRhineModel(RHINE_ROWS * RHINE_LANES, controller.signal);
        if (controller.signal.aborted) { model.dispose(); return; }
        const input = sceneInput(latest.current);
        view = new RhineRenderer(canvas);
        view.initialize(input.tuning.quality);
        scene = new RhineScene(view, model, input);
        view.onAssetsReady = model.onArtworkReady = () => {
          if (failed || controller.signal.aborted) return;
          try { scene?.paint(); } catch (error) { fail(error); }
        };
        scene.resize(width, height);
        setStatus("ready");
        sync();
      } catch (error) {
        // Construction can fail before the scene owns these resources.
        if (!scene) { model?.dispose(); view?.dispose(); }
        fail(error);
      }
    })();

    return () => {
      controller.abort(); stop();
      synchronize.current = null;
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", contextLost);
      resize.disconnect(); intersection.disconnect();
      scene?.dispose();
    };
  }, [attempt]);

  return { canvasRef, status, attempt, retry: () => setAttempt((value) => value + 1) };
}

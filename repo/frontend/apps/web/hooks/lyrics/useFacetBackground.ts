"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { extractRepresentativeColors } from "@/components/lyrics/folia/src/utils/colorExtractor";
import { DEFAULT_FACET_BACKGROUND_TUNING } from "@/constants/facetBackground";
import { loadFacetCover } from "@/lib/lyrics/facet/cover";
import { resolveFacetPalette } from "@/lib/lyrics/facet/palette";
import { FacetRenderer, loadFacetShaders } from "@/lib/lyrics/facet/renderer";
import { FacetScene } from "@/lib/lyrics/facet/scene";
import { createFrameStats } from "@/lib/lyrics/frameStats";
import type { Line } from "@/components/lyrics/folia/src/types";
import type { LyricChorusRange } from "@/types/lyrics/model";
import type {
  FacetBackgroundProps,
  FacetLoadState,
  FacetLyricSample,
  FacetSceneInput,
} from "@/types/lyrics/facet/background";

const COVER_COLORS = 2;
const FRAME_REPORT_MS = 30_000;
const ESTIMATED_WORDS_MAX = 16;

function sceneInput(props: FacetBackgroundProps, coverColors: readonly string[]): FacetSceneInput {
  // Themes can come from outside (AI themes), so an unknown value just means normal.
  const intensity = props.theme.animationIntensity;
  return {
    intensity: intensity === "calm" || intensity === "chaotic" ? intensity : "normal",
    seed: String(props.seed ?? "facet"),
    palette: resolveFacetPalette(props.theme, coverColors),
    tuning: { ...DEFAULT_FACET_BACKGROUND_TUNING, ...props.config?.facet?.tuning },
    frozen: props.paused || props.staticMode,
    still: props.staticMode,
    vignette: !(props.config?.common?.disableVignette ?? false),
  };
}

/** How many words of a line have started. A line timed only as a whole gets one facet per estimated word. */
function wordsStarted(line: Line, time: number, progress: number) {
  if (line.words.length > 1) {
    let started = 0;
    for (const word of line.words) if (word.startTime <= time) started += 1;
    return started;
  }
  const estimated = Math.min(Array.from(line.fullText).length, ESTIMATED_WORDS_MAX);
  return Math.ceil(Math.min(1, Math.max(0, progress)) * estimated);
}

/** Where the singing is right now; null when this stage has no lyric clock to follow. */
function lyricSample(
  { lyric }: FacetBackgroundProps,
  chorusRanges: readonly LyricChorusRange[] | undefined,
): FacetLyricSample | null {
  if (!lyric) return null;
  const time = lyric.currentTime.get();
  const chorus = chorusRanges?.length
    ? chorusRanges.some((range) => {
        const ms = time * 1000;
        return ms >= range.startTimeMs && ms < range.endTimeMs;
      })
    : null;
  const line = lyric.lines[lyric.currentLineIndex];
  if (!line) return { lineIndex: -1, progress: 0, singing: false, wordsSung: 0, chorus };
  const length = Math.max(line.endTime - line.startTime, 0.001);
  const progress = (time - line.startTime) / length;
  return {
    lineIndex: lyric.currentLineIndex,
    progress: Math.min(1, Math.max(0, progress)),
    singing: progress < 1,
    wordsSung: wordsStarted(line, time, progress),
    chorus,
  };
}

export function useFacetBackground(props: FacetBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coverColors, setCoverColors] = useState<string[]>([]);
  const chorusRanges = props.lyric?.chorusRanges;
  const latest = useRef({ props, coverColors, chorusRanges });
  const cover = useRef<ImageBitmap | null>(null);
  const showCover = useRef<((bitmap: ImageBitmap | null) => void) | null>(null);
  const synchronize = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<FacetLoadState>("loading");
  const [attempt, setAttempt] = useState(0);
  const { coverUrl } = props;

  useLayoutEffect(() => {
    latest.current = { props, coverColors, chorusRanges };
    synchronize.current?.();
  });

  useEffect(() => {
    let active = true;
    if (coverUrl) {
      void extractRepresentativeColors(coverUrl, COVER_COLORS).then((colors) => {
        if (active) setCoverColors(colors);
      });
      void loadFacetCover(coverUrl).then((bitmap) => {
        if (!active) {
          bitmap?.close();
          return;
        }
        cover.current?.close();
        cover.current = bitmap;
        showCover.current?.(bitmap);
      });
    } else {
      setCoverColors([]);
    }
    return () => {
      active = false;
    };
  }, [coverUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const controller = new AbortController();
    const currentInput = () => sceneInput(latest.current.props, latest.current.coverColors);
    let renderer: FacetRenderer | undefined;
    let scene: FacetScene | undefined;
    let request = 0;
    let previousTime: number | null = null;
    let visible = true;
    let failed = false;
    let width = container.clientWidth;
    let height = container.clientHeight;
    const frameStats = createFrameStats("FacetBackground", {
      reportMs: FRAME_REPORT_MS,
      onReport: () => {
        if (!renderer) return;
        const gpuMs = renderer.takeGpuMs();
        const size = renderer.size;
        const song = scene?.takeStats();
        console.info(
          `[FacetBackground] ${size.width}x${size.height} on ${renderer.adapter}, GPU ` +
            `${gpuMs === null ? "timer unavailable" : `${gpuMs.toFixed(1)} ms per frame`}; ` +
            `${song?.kicks ?? 0} kicks, ${song?.words ?? 0} words, ${song?.lines ?? 0} lines, ` +
            `${song?.turns ?? 0} turns, ${song?.tears ?? 0} tears, ` +
            `energy ${(song?.energy ?? 0).toFixed(2)}`,
        );
      },
    });
    setStatus("loading");

    const stop = () => {
      cancelAnimationFrame(request);
      request = 0;
      previousTime = null;
      frameStats.pause();
    };
    const running = () => {
      const { paused, staticMode } = latest.current.props;
      return (
        !controller.signal.aborted &&
        !failed &&
        visible &&
        !document.hidden &&
        width > 0 &&
        height > 0 &&
        !paused &&
        !staticMode
      );
    };
    const fail = (error: unknown) => {
      if (controller.signal.aborted || failed) return;
      failed = true;
      stop();
      console.warn("[FacetBackground] Scene unavailable", error);
      setStatus("error");
    };
    const tick = (now: number) => {
      request = 0;
      if (!scene || !running()) {
        previousTime = null;
        frameStats.pause();
        return;
      }
      frameStats.sample(now);
      const { props: current, chorusRanges: ranges } = latest.current;
      const { audioBands, config } = current;
      const frameRate =
        config?.facet?.tuning?.frameRate ?? DEFAULT_FACET_BACKGROUND_TUNING.frameRate;
      if (previousTime === null) previousTime = now;
      const elapsed = now - previousTime;
      if (elapsed >= 1000 / Number(frameRate) - 0.5) {
        previousTime = now;
        try {
          // Folia's bands use the analyser's 0-255 scale.
          scene.advance(
            elapsed,
            {
              low: audioBands.bass.get() / 255,
              mid: (audioBands.mid.get() + audioBands.vocal.get()) / 510,
              high: audioBands.treble.get() / 255,
              spectrum: audioBands.spectrum?.get(),
            },
            lyricSample(current, ranges),
          );
        } catch (error) {
          fail(error);
          return;
        }
      }
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (!scene || failed || controller.signal.aborted) return;
      try {
        if (scene.setInput(currentInput())) scene.paint();
      } catch (error) {
        fail(error);
        return;
      }
      if (!running()) stop();
      else if (!request) request = requestAnimationFrame(tick);
    };
    synchronize.current = sync;
    const resize = new ResizeObserver((entries) => {
      const size = entries[0]?.contentRect;
      if (!size) return;
      width = size.width;
      height = size.height;
      if (scene && !failed && width > 0 && height > 0) {
        try {
          scene.resize(width, height);
        } catch (error) {
          fail(error);
        }
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
      event.preventDefault();
      fail(new Error("WebGL context lost"));
    };
    canvas.addEventListener("webglcontextlost", contextLost);

    void (async () => {
      const startedAt = performance.now();
      try {
        const sources = await loadFacetShaders(controller.signal);
        controller.signal.throwIfAborted();
        renderer = new FacetRenderer(canvas);
        await renderer.compile(sources, controller.signal);
        controller.signal.throwIfAborted();
        scene = new FacetScene(renderer, currentInput());
        scene.resize(width, height);
        showCover.current = (bitmap) => scene?.setCover(bitmap);
        showCover.current(cover.current);
        setStatus("ready");
        sync();
        console.info(
          `[FacetBackground] ready in ${Math.round(performance.now() - startedAt)} ms on ${renderer.adapter}`,
        );
      } catch (error) {
        fail(error);
      }
    })();

    return () => {
      controller.abort();
      stop();
      synchronize.current = null;
      showCover.current = null;
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", contextLost);
      resize.disconnect();
      intersection.disconnect();
      renderer?.dispose();
    };
  }, [attempt]);

  return { canvasRef, status, attempt, retry: () => setAttempt((value) => value + 1) };
}

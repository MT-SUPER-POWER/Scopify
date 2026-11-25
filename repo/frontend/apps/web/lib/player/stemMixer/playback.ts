import { STEM_MIXER_RATE } from "@/constants/stemMixer";
import { useStemMixerStore } from "@/store/module/stemMixer";
import type { StemMixerAudioGraph } from "@/types/audio/stemMixer";

import { createStemMixerPlayer } from "./folia/stemMixerPlayer";
import { runStemPass } from "./folia/stemPass";
import { openStemMixerTask, STEM_MIXER_MAX_SECONDS } from "./folia/stemMixerTask";
import { createStemGpu, StemMixerSlowGpuError, StemMixerUnsupportedError } from "./stemGpu";

const AHEAD = 30 * STEM_MIXER_RATE;
const BEHIND = 15 * STEM_MIXER_RATE;
const KEEP_AHEAD = AHEAD + 10 * STEM_MIXER_RATE;
const JUMP_AHEAD = 10 * STEM_MIXER_RATE;
const RETRY_DELAY_MS = 3000;
const RETRIES = 4;

async function decodeTrack(url: string, signal: AbortSignal) {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(60_000)]),
  });
  if (!response.ok || response.status === 206)
    throw new Error(`Incomplete audio response (${response.status})`);
  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  const decoder = new OfflineAudioContext(2, 1, STEM_MIXER_RATE);
  const audio = await decoder.decodeAudioData(bytes);
  signal.throwIfAborted();
  return audio;
}

export async function startStemMixer(
  audio: HTMLAudioElement,
  context: AudioContext,
  graph: StemMixerAudioGraph,
  lifetime: AbortSignal,
) {
  const { setPhase, setBlock } = useStemMixerStore.getState();
  const player = await createStemMixerPlayer(context);
  if (lifetime.aborted) return;
  if (!player) {
    setPhase("failed");
    return;
  }

  try {
    player.follow(graph, audio);
  } catch (error) {
    player.dispose();
    setPhase("failed");
    console.warn("[StemMixer] Could not attach the worklet", error);
    return;
  }

  player.setGains(useStemMixerStore.getState().gains);
  const unsubscribe = useStemMixerStore.subscribe((next, before) => {
    if (next.gains !== before.gains) player.setGains(next.gains);
  });
  const gpu = createStemGpu(() => setPhase("loadingModel"));
  let src: string | null = null;
  let source = new AbortController();
  let separation: { controller: AbortController; frontier: number } | null = null;
  let decoded: AudioBuffer | null = null;
  let decoding = false;
  let tooLong = false;
  let retryAt = 0;
  let failures = 0;

  const reset = () => {
    source.abort();
    source = new AbortController();
    separation?.controller.abort();
    separation = null;
    src = null;
    decoded = null;
    decoding = false;
    tooLong = false;
    retryAt = 0;
    failures = 0;
    player.unload();
  };

  const reportError = (error: unknown) => {
    if (error instanceof StemMixerUnsupportedError || error instanceof StemMixerSlowGpuError) {
      setBlock(error instanceof StemMixerSlowGpuError ? "tooSlow" : "noGpu");
      return;
    }
    failures += 1;
    retryAt = performance.now() + RETRY_DELAY_MS;
    setPhase(failures >= RETRIES ? "failed" : "waiting");
    console.warn("[StemMixer] Could not prepare the current audio", error);
  };

  const beginSeparation = (track: AudioBuffer, from: number) => {
    separation?.controller.abort();
    const task = { controller: new AbortController(), frontier: from };
    separation = task;
    const { signal } = task.controller;
    const left = track.getChannelData(0);
    const right = track.getChannelData(Math.min(track.numberOfChannels - 1, 1));
    const { readers, reached } = openStemMixerTask({ left, right }, from, {
      onChunk: (start, end, data) => {
        if (signal.aborted || !player.addChunk(start, end, data)) return false;
        task.frontier = end;
        failures = 0;
        return true;
      },
      held: (end) => end > (player.playhead() ?? 0) + AHEAD,
      urgent: () => true,
    });
    if (useStemMixerStore.getState().phase !== "ready") setPhase("separating");
    void runStemPass({
      left,
      right,
      readers: () => readers,
      keepGoing: () => !signal.aborted,
      separate: (l, r) => gpu.separate(l, r, signal),
    })
      .then(() => {
        if (!signal.aborted && reached() < track.length)
          throw new Error("Stem worklet did not receive the full segment");
      })
      .catch((error: unknown) => {
        if (!signal.aborted) reportError(error);
      })
      .finally(() => {
        if (separation === task) separation = null;
      });
  };

  const tick = () => {
    if (lifetime.aborted || useStemMixerStore.getState().block) return;
    if (!player.attached()) {
      separation?.controller.abort();
      gpu.dispose();
      setPhase("failed");
      return;
    }
    if (
      !audio.currentSrc ||
      audio.currentSrc !== audio.src ||
      audio.readyState < HTMLMediaElement.HAVE_METADATA
    ) {
      if (src) reset();
      setPhase("waiting");
      return;
    }
    if (audio.currentSrc !== src) {
      reset();
      src = audio.currentSrc;
    }
    if (tooLong || (Number.isFinite(audio.duration) && audio.duration > STEM_MIXER_MAX_SECONDS)) {
      setPhase("tooLong");
      return;
    }
    if (audio.playbackRate !== 1) {
      setPhase("notFollowing");
      return;
    }

    const mayRetry = failures < RETRIES && performance.now() >= retryAt;
    if (!decoded) {
      if (decoding || !mayRetry) return;
      decoding = true;
      const url = src;
      const { signal } = source;
      setPhase("waiting");
      void decodeTrack(url, signal)
        .then((track) => {
          if (signal.aborted) return;
          if (track.duration > STEM_MIXER_MAX_SECONDS) {
            tooLong = true;
            setPhase("tooLong");
            return;
          }
          // A preview or partial response must never be mixed against the full song.
          if (Number.isFinite(audio.duration) && Math.abs(track.duration - audio.duration) > 1)
            throw new Error("Decoded audio duration differs from the player");
          decoded = track;
          failures = 0;
          player.load(url);
          tick();
        })
        .catch((error: unknown) => {
          if (!signal.aborted) reportError(error);
        })
        .finally(() => {
          if (!signal.aborted) decoding = false;
        });
      return;
    }

    const head = player.playhead() ?? 0;
    player.keep(head - BEHIND, head + KEEP_AHEAD);
    const here = player.covered().find(([start, end]) => start <= head && head < end);
    const frontier = here?.[1] ?? head;
    if (separation) {
      const joined = here
        ? frontier >= separation.frontier
        : head >= separation.frontier && head <= separation.frontier + JUMP_AHEAD;
      if (!joined && frontier < decoded.length) beginSeparation(decoded, frontier);
    } else if (mayRetry && frontier < decoded.length && frontier < head + AHEAD) {
      beginSeparation(decoded, frontier);
    }
    if (here) setPhase(player.following() ? "ready" : "notFollowing");
    else if (separation && useStemMixerStore.getState().phase !== "loadingModel")
      setPhase("separating");
    else if (!separation && !mayRetry) setPhase(failures >= RETRIES ? "failed" : "waiting");
  };

  const onSourceChange = () => {
    reset();
    setPhase("waiting");
  };
  const onSeek = () => {
    retryAt = 0;
    failures = 0;
    tick();
  };
  const timer = setInterval(tick, 500);
  audio.addEventListener("loadstart", onSourceChange);
  audio.addEventListener("emptied", onSourceChange);
  audio.addEventListener("loadedmetadata", tick);
  audio.addEventListener("seeked", onSeek);
  lifetime.addEventListener(
    "abort",
    () => {
      clearInterval(timer);
      audio.removeEventListener("loadstart", onSourceChange);
      audio.removeEventListener("emptied", onSourceChange);
      audio.removeEventListener("loadedmetadata", tick);
      audio.removeEventListener("seeked", onSeek);
      unsubscribe();
      reset();
      gpu.dispose();
      player.dispose();
    },
    { once: true },
  );
  tick();
}

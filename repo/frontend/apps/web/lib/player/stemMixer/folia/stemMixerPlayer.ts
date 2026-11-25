import { STEM_MIXER_ASSET_PATH } from "@/constants/stemMixer";
import type { StemMixerAudioGraph } from "@/types/audio/stemMixer";

const workletUrl = `${STEM_MIXER_ASSET_PATH}/stemMixer.worklet.js`;

// src/services/stemMixer/stemMixerPlayer.ts
// 分轨调音台的播放端（主线程）：把 worklet（stemMixer.worklet.ts）插进正在放的那个 deck，跟着元素走。
//
// Scopify connects source → worklet → ReplayGain. The worklet passes the original signal through
// until separated samples are ready or while all gains are at unity. After disabling, it fades
// back to the source before the original graph connection is restored.
//
// 元素照常在放，是时钟：歌词、进度条、画面都跟着它。worklet 跟着它的事件起停——播放、暂停、跳转、缓冲、
// 换歌——并每半秒对一次位置，差出 60 ms 就重新给位置（worklet 自己经元素的声音交叉过去，不留空白）。
// 播放速度不是 1.0 时停下、透传（worklet 不做保持音高的变速）。
//
// 只在放进来的正是元素这首歌时跟着放：载入时记下元素的 src，规范成绝对地址比较，对不上就透传。
// 块（原曲与三轨的一段）由主线程分配好转交给 worklet，`keep` 告诉它留播放头附近的哪一段。

/** 起播提前量：消息到 worklet 要一个 quantum 左右，留足；晚到了 worklet 自己往前补。 */
const LEAD_SEC = 0.04;
const DRIFT_SEC = 0.06;
const CHECK_MS = 500;
const STEM_RATE = 44100;

const modules = new WeakMap<BaseAudioContext, Promise<void>>();
const nodes = new WeakMap<StemMixerAudioGraph, AudioWorkletNode>();
const retirements = new WeakMap<StemMixerAudioGraph, ReturnType<typeof setTimeout>>();
/** 出过错、已拆下的 worklet：不再往里送，也不算在跟着放。 */
const failed = new WeakSet<AudioWorkletNode>();

const restore = (chain: StemMixerAudioGraph, node: AudioWorkletNode) => {
  if (nodes.get(chain) !== node) return;
  chain.source.connect(chain.replayGain);
  chain.source.disconnect(node);
  node.disconnect();
  node.port.close();
  nodes.delete(chain);
};

const retire = (chain: StemMixerAudioGraph, node: AudioWorkletNode) => {
  if (nodes.get(chain) !== node) return;
  // Allow the audio thread to finish its 5 ms fade before disconnecting the node.
  retirements.set(
    chain,
    setTimeout(() => {
      retirements.delete(chain);
      restore(chain, node);
    }, 70),
  );
};

const nodeFor = (context: AudioContext, chain: StemMixerAudioGraph): AudioWorkletNode => {
  clearTimeout(retirements.get(chain));
  retirements.delete(chain);
  const existing = nodes.get(chain);
  if (existing) return existing;
  const node = new AudioWorkletNode(context, "folia-stem-mixer", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    channelCount: 2,
    channelCountMode: "explicit",
    channelInterpretation: "speakers",
  });
  // 先接上新路再断旧路：中间最多叠一个 quantum，不会有一刻没声音。
  chain.source.connect(node).connect(chain.replayGain);
  try {
    chain.source.disconnect(chain.replayGain);
  } catch {
    /* 开发时热重载过：早已改接 */
  }
  // worklet 出错就不再出声：接回元素直连，这个 deck 照常放原曲。
  node.onprocessorerror = () => {
    console.warn("[StemMixer] worklet failed; the deck plays the element directly again");
    failed.add(node);
    restore(chain, node);
  };
  nodes.set(chain, node);
  return node;
};

/** 规范成绝对地址：元素的 currentSrc 是规范过的，store 里的不一定。 */
const normalise = (src: string | null | undefined): string | null => {
  if (!src) return null;
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
};

export interface StemMixerPlayer {
  /** Load an audio source and discard the previous source's chunks. */
  load: (src: string) => void;
  /** [from, to) 的一块：原曲 L/R、鼓 L/R、贝斯 L/R、人声 L/R。答 false：没接到 deck 或没载入，没收下。 */
  addChunk: (from: number, to: number, data: Int16Array[]) => boolean;
  /** 已接到一个能用的 deck（块送得进去）。 */
  attached: () => boolean;
  /** 只留与 [from, to) 有交集的块。 */
  keep: (from: number, to: number) => void;
  /** 已有块的区间（44.1 kHz 采样），按 from 排好、相接的已并起来。 */
  covered: () => ReadonlyArray<readonly [number, number]>;
  setGains: (gains: readonly number[]) => void;
  /** 接到这个 deck、跟着这个元素（换 deck 时再调一次）；null 不再跟。 */
  follow: (chain: StemMixerAudioGraph | null, element: HTMLMediaElement | null) => void;
  /** 元素此刻的位置（44.1 kHz 采样），没有元素时为 null。 */
  playhead: () => number | null;
  /** 元素此刻放的正是载入的这首、速度 1.0（否则 worklet 只透传）。 */
  following: () => boolean;
  unload: () => void;
  dispose: () => void;
}

/** 在这个 AudioContext 上建调音台的播放端；worklet 模块载入失败时答 null（调音台不可用）。 */
export const createStemMixerPlayer = async (
  context: AudioContext,
): Promise<StemMixerPlayer | null> => {
  let ready = modules.get(context);
  if (!ready) {
    ready = context.audioWorklet.addModule(workletUrl);
    modules.set(context, ready);
  }
  try {
    await ready;
  } catch (error) {
    modules.delete(context);
    console.warn("[StemMixer] worklet could not load", error);
    return null;
  }
  let node: AudioWorkletNode | null = null;
  let loaded: string | null = null;
  let spans: Array<[number, number]> = [];
  let ranges: Array<[number, number]> = [];
  let chain: StemMixerAudioGraph | null = null;
  let element: HTMLMediaElement | null = null;
  let gains: number[] = [1, 1, 1, 1];
  /** 每载入一首（或不再放）加一；worklet 只收这一代的块。 */
  let gen = 0;
  let sounding = false;
  let lastReport: { position: number; time: number } | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  /** 每次起播加一；worklet 的位置报告带着它，旧的不算（跳转后晚到的会被当成走偏）。 */
  let seq = 0;

  const post = (message: unknown, transfer: Transferable[] = []) =>
    node?.port.postMessage(message, transfer);

  const remerge = () => {
    const merged: Array<[number, number]> = [];
    for (const [a, b] of [...spans].sort((x, y) => x[0] - y[0])) {
      const last = merged.at(-1);
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else merged.push([a, b]);
    }
    ranges = merged;
  };

  /** 元素这首正是载入的那首，且能由 worklet 跟着放。 */
  const matches = () =>
    Boolean(
      loaded &&
      element &&
      node &&
      !failed.has(node) &&
      normalise(element.getAttribute("src")) === loaded &&
      normalise(element.currentSrc) === loaded &&
      element.playbackRate === 1,
    );

  const stopSounding = () => {
    if (sounding) post({ type: "stop" });
    sounding = false;
    lastReport = null;
  };

  /** 从元素此刻的位置起播（提前 LEAD_SEC 算好那时它在哪）。 */
  const startSounding = () => {
    if (!element) return;
    const at = context.currentTime + LEAD_SEC;
    const media = element.currentTime + LEAD_SEC * element.playbackRate;
    const speed = STEM_RATE / context.sampleRate;
    const raw = media * STEM_RATE;
    seq += 1;
    post({ type: "play", position: speed === 1 ? Math.round(raw) : raw, at, speed, seq });
    sounding = true;
    lastReport = null;
  };

  const running = () =>
    Boolean(
      element && !element.paused && !element.ended && !element.seeking && element.readyState >= 3,
    );

  /** 按元素现在的状态：在放这首就跟着起播，否则停下（透传）。 */
  const sync = () => {
    if (!matches() || !running()) {
      stopSounding();
      return;
    }
    if (!sounding) startSounding();
  };

  /** 半秒一次：worklet 报的位置与元素差出 DRIFT_SEC 就重新给位置。 */
  const check = () => {
    // 没起播、或元素没在走（卡住了却没发 waiting）：只按状态起停，不拿它的位置对齐。
    if (!sounding || !lastReport || !element || !matches() || !running()) {
      sync();
      return;
    }
    const ours = lastReport.position / STEM_RATE + (context.currentTime - lastReport.time);
    if (Math.abs(ours - element.currentTime) > DRIFT_SEC) startSounding();
  };

  const onReport = (
    event: MessageEvent<{ type: string; position: number; time: number; seq: number }>,
  ) => {
    if (event.data.type === "position" && event.data.seq === seq)
      lastReport = { position: event.data.position, time: event.data.time };
  };

  const events = [
    "play",
    "playing",
    "pause",
    "waiting",
    "stalled",
    "seeking",
    "seeked",
    "ratechange",
    "ended",
    "emptied",
    "loadstart",
    "canplay",
    "volumechange",
  ];
  const sendVolume = () =>
    post({ type: "volume", volume: element?.muted ? 0 : (element?.volume ?? 1) });

  const onEvent = (event: Event) => {
    if (event.type === "volumechange") sendVolume();
    // 跳转、缓冲、换源：先停，等能放了再按新位置起播。
    if (
      event.type === "seeking" ||
      event.type === "waiting" ||
      event.type === "emptied" ||
      event.type === "loadstart"
    )
      stopSounding();
    sync();
  };

  const clearChunks = () => {
    spans = [];
    ranges = [];
    gen += 1;
    post({ type: "load", gen });
  };

  const follow: StemMixerPlayer["follow"] = (nextChain, nextElement) => {
    if (nextChain !== chain || nextElement !== element) {
      stopSounding();
      if (element) for (const type of events) element.removeEventListener(type, onEvent);
      if (node) {
        clearChunks();
        node.port.onmessage = null;
        if (chain) retire(chain, node);
      }
      chain = nextChain;
      element = nextElement;
      node = chain ? nodeFor(context, chain) : null;
      if (node) {
        node.port.onmessage = onReport;
        post({ type: "gains", gains });
        sendVolume();
        clearChunks();
      }
      if (element) for (const type of events) element.addEventListener(type, onEvent);
    } else if (chain && node && failed.has(node)) {
      stopSounding();
      return;
    }
    if (chain && element && timer === null) timer = setInterval(check, CHECK_MS);
    if ((!chain || !element) && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    sync();
  };

  const unload = () => {
    stopSounding();
    loaded = null;
    clearChunks();
  };

  return {
    load: (src) => {
      stopSounding();
      loaded = normalise(src);
      clearChunks();
      sync();
    },
    addChunk: (from, to, data) => {
      if (!loaded || !node || failed.has(node)) return false;
      spans.push([from, to]);
      remerge();
      post(
        { type: "chunk", gen, from, to, data },
        data.map((channel) => channel.buffer),
      );
      return true;
    },
    attached: () => Boolean(node && !failed.has(node)),
    keep: (from, to) => {
      const before = spans.length;
      spans = spans.filter(([a, b]) => b > from && a < to);
      if (spans.length === before) return;
      remerge();
      post({ type: "keep", from, to });
    },
    covered: () => ranges,
    setGains: (next) => {
      gains = [...next];
      post({ type: "gains", gains });
    },
    follow,
    playhead: () => (element ? Math.round(element.currentTime * STEM_RATE) : null),
    following: matches,
    unload,
    dispose: () => {
      unload();
      follow(null, null);
    },
  };
};

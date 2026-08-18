import { afterAll, describe, expect, test } from "bun:test";

import {
  AUDIO_EQUALIZER_BANDS,
  AUDIO_EQUALIZER_PRESETS,
  DEFAULT_AUDIO_EQUALIZER_SETTINGS,
} from "@/constants/audioEqualizer";
import { resolveAudioEqualizerSettings } from "@/lib/player/audioEqualizer";
import {
  applyAudioEqualizerSettings,
  connectAudioEqualizerGraph,
} from "@/lib/player/audioEqualizerGraph";

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const storedValues = new Map<string, string>();
const memoryStorage: Storage = {
  clear: () => storedValues.clear(),
  getItem: (key) => storedValues.get(key) ?? null,
  key: (index) => [...storedValues.keys()][index] ?? null,
  get length() {
    return storedValues.size;
  },
  removeItem: (key) => storedValues.delete(key),
  setItem: (key, value) => storedValues.set(key, value),
};

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: memoryStorage,
});

const { useAudioEqualizerStore } = await import("@/store/module/audioEqualizer");

afterAll(() => {
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
  } else {
    Reflect.deleteProperty(globalThis, "localStorage");
  }
});

const createAudioParam = () => ({
  value: 0,
  cancelledAt: -1,
  target: [] as number[],
  cancelScheduledValues(time: number) {
    this.cancelledAt = time;
  },
  setTargetAtTime(value: number, time: number, constant: number) {
    this.target = [value, time, constant];
  },
});

const createFilter = () => ({
  type: "peaking",
  frequency: createAudioParam(),
  Q: createAudioParam(),
  gain: createAudioParam(),
  connectedTo: null as AudioNode | null,
  connect(node: AudioNode) {
    this.connectedTo = node;
    return node;
  },
});

describe("audio equalizer", () => {
  test("opens the requested audio settings tab", () => {
    useAudioEqualizerStore.setState({ dialogTab: "quality", isDialogOpen: false });

    useAudioEqualizerStore.getState().openDialog("equalizer");

    expect(useAudioEqualizerStore.getState().isDialogOpen).toBe(true);
    expect(useAudioEqualizerStore.getState().dialogTab).toBe("equalizer");
  });

  test("normalizes persisted values into ten safe bands", () => {
    const settings = resolveAudioEqualizerSettings({
      enabled: true,
      gains: [20, -20, "4", Number.NaN],
    });

    expect(settings.enabled).toBe(true);
    expect(settings.gains).toHaveLength(AUDIO_EQUALIZER_BANDS.length);
    expect(settings.gains.slice(0, 5)).toEqual([12, -12, 4, 0, 0]);
    expect(settings.preset).toBe("custom-1");
    expect(settings.customGains).toEqual(settings.gains);
  });

  test("preserves custom gains while a built-in preset is active", () => {
    const customGains = [3, 2, 1, 0, -1, -2, -3, -4, -5, -6];
    const settings = resolveAudioEqualizerSettings({
      enabled: true,
      gains: AUDIO_EQUALIZER_PRESETS.lofi,
      preset: "lofi",
      customGains,
    });

    expect(settings.preset).toBe("lofi");
    expect(settings.gains).toEqual([...AUDIO_EQUALIZER_PRESETS.lofi]);
    expect(settings.customGains).toEqual(customGains);
  });

  test("connects and bypasses a ten-filter Web Audio chain", () => {
    const filters = AUDIO_EQUALIZER_BANDS.map(() => createFilter());
    let filterIndex = 0;
    const context = {
      currentTime: 2,
      sampleRate: 48_000,
      createBiquadFilter: () => filters[filterIndex++],
      createGain: () => ({
        connect: () => {},
        gain: createAudioParam(),
      }),
    } as unknown as AudioContext;
    const input = createFilter();
    const output = {} as AudioNode;
    const graph = connectAudioEqualizerGraph(context, input as unknown as AudioNode, output, {
      ...DEFAULT_AUDIO_EQUALIZER_SETTINGS,
      enabled: true,
      gains: Array.from({ length: 10 }, (_, index) => index - 5),
      preset: "custom-1",
      customGains: Array(10).fill(0),
    });

    expect(graph.filters).toHaveLength(10);
    expect(graph.filters[0].type).toBe("lowshelf");
    expect(graph.filters[9].type).toBe("highshelf");
    expect(graph.filters[0].gain.value).toBe(-5);
    expect(graph.filters[9].gain.value).toBe(4);

    applyAudioEqualizerSettings(context, graph, {
      ...DEFAULT_AUDIO_EQUALIZER_SETTINGS,
      enabled: false,
      gains: Array(10).fill(6),
      preset: "custom-1",
      customGains: Array(10).fill(6),
    });
    graph.filters.forEach((node) => {
      const gain = node.gain as unknown as ReturnType<typeof createAudioParam>;
      expect(gain.cancelledAt).toBe(2);
      expect(gain.target).toEqual([0, 2, 0.015]);
    });
  });
});

import { describe, expect, test } from "bun:test";

import type { NativeModuleLoader } from "@main/services/nativeModuleLoader";
import { createNativeAudioHost, type NativeAudioSnapshot } from "@main/capabilities/nativeAudio";

class FakeNativeAudioPlayer {
  disposeCount = 0;
  private listener: ((event: unknown) => void) | null = null;
  snapshot: NativeAudioSnapshot = makeSnapshot();

  dispose() {
    this.disposeCount += 1;
  }

  emit(type: string, snapshot: NativeAudioSnapshot) {
    this.snapshot = structuredClone(snapshot);
    this.listener?.({ snapshot, type });
  }

  getSnapshot() {
    return structuredClone(this.snapshot);
  }

  async load(request: unknown) {
    const input = request as { loadId: string };
    this.snapshot = makeSnapshot({
      loadId: input.loadId,
      phase: "paused",
      token: 2,
    });
    return this.getSnapshot();
  }

  onEvent(listener: (event: unknown) => void) {
    this.listener = listener;
  }

  pause() {
    this.snapshot = { ...this.snapshot, phase: "paused" };
  }

  play() {
    this.snapshot = { ...this.snapshot, phase: "playing" };
  }

  seek(positionMs: number) {
    this.snapshot = { ...this.snapshot, positionMs };
    return this.getSnapshot();
  }

  setVolume(volume: number) {
    this.snapshot = { ...this.snapshot, volume };
  }

  stop() {
    this.snapshot = { ...this.snapshot, phase: "stopped", positionMs: 0 };
  }
}

function makeSnapshot(overrides: Partial<NativeAudioSnapshot> = {}): NativeAudioSnapshot {
  return {
    durationMs: 180_000,
    error: null,
    loadId: null,
    phase: "idle",
    positionMs: 0,
    token: null,
    volume: 1,
    ...overrides,
  };
}

function createAvailableLoader(player: FakeNativeAudioPlayer): NativeModuleLoader {
  return {
    loadAudioEngine() {
      return {
        available: true,
        module: {
          createNativeAudioPlayer: () => player,
        },
        modulePath: "C:\\native\\scopify-audio-engine.win32-x64-msvc.node",
      };
    },
    resolveAudioEnginePaths() {
      return [];
    },
  };
}

describe("Native audio host", () => {
  test("reports a missing optional module as unavailable without throwing", () => {
    const host = createNativeAudioHost({
      loader: {
        loadAudioEngine() {
          return {
            available: false,
            diagnostic: "native binary missing",
            reason: "module-missing",
          };
        },
        resolveAudioEnginePaths() {
          return [];
        },
      },
    });

    expect(host.getAvailability()).toEqual({
      available: false,
      diagnostic: "native binary missing",
      reason: "module-missing",
    });
  });

  test("accepts a compiled engine that reports itself ready", () => {
    const player = new FakeNativeAudioPlayer();
    const host = createNativeAudioHost({
      loader: {
        loadAudioEngine() {
          return {
            available: true,
            module: {
              createNativeAudioPlayer: () => player,
              getNativeAudioEngineInfo: () => ({
                diagnostic: "decoder and output are ready",
                ready: true,
              }),
            },
            modulePath: "C:\\native\\scopify-audio-engine.win32-x64-msvc.node",
          };
        },
        resolveAudioEnginePaths() {
          return [];
        },
      },
    });

    expect(host.getAvailability()).toEqual({
      available: true,
      modulePath: "C:\\native\\scopify-audio-engine.win32-x64-msvc.node",
    });
    expect(player.disposeCount).toBe(0);
  });

  test("normalizes optional fields omitted by the generated NAPI object", async () => {
    const player = new FakeNativeAudioPlayer();
    player.load = async (request: unknown) => {
      const input = request as { loadId: string };
      return {
        durationMs: 1_000,
        loadId: input.loadId,
        phase: "paused",
        positionMs: 0,
        token: 4,
        volume: 1,
      } as unknown as NativeAudioSnapshot;
    };
    const host = createNativeAudioHost({ loader: createAvailableLoader(player) });

    expect(
      await host.load({
        loadId: "napi-optional-fields",
        source: { kind: "https", url: "https://cdn.example.test/song.flac" },
      }),
    ).toMatchObject({ status: "accepted" });
    expect(host.getSnapshot()).toMatchObject({ error: null, loadId: "napi-optional-fields" });
  });

  test("filters stale load identity and stale Rust token events", async () => {
    const player = new FakeNativeAudioPlayer();
    const host = createNativeAudioHost({ loader: createAvailableLoader(player) });
    const delivered: string[] = [];
    host.subscribe((event) => delivered.push(event.type));

    const loaded = await host.load({
      loadId: "session-load-a",
      source: { kind: "https", url: "https://cdn.example.test/song.flac" },
    });
    expect(loaded.status).toBe("accepted");

    player.emit("position", makeSnapshot({ loadId: "session-load-b", positionMs: 10, token: 2 }));
    player.emit("position", makeSnapshot({ loadId: "session-load-a", positionMs: 20, token: 1 }));
    player.emit("position", makeSnapshot({ loadId: "session-load-a", positionMs: 30, token: 2 }));

    expect(host.getSnapshot().positionMs).toBe(30);
    expect(delivered).toEqual(["state-changed", "loaded", "position"]);
  });

  test("drops callbacks from the previous token during an async reload hand-off", async () => {
    const player = new FakeNativeAudioPlayer();
    const host = createNativeAudioHost({ loader: createAvailableLoader(player) });
    const delivered: string[] = [];
    host.subscribe((event) => delivered.push(event.type));

    await host.load({
      loadId: "same-session-load",
      source: { kind: "https", url: "https://cdn.example.test/first.flac" },
    });

    let completeReload: () => void = () => {
      throw new Error("The native load hand-off was not started.");
    };
    player.load = (request: unknown) =>
      new Promise((resolve) => {
        completeReload = () => {
          const input = request as { loadId: string };
          player.snapshot = makeSnapshot({
            loadId: input.loadId,
            phase: "paused",
            token: 3,
          });
          resolve(player.getSnapshot());
        };
      });

    const reloading = host.load({
      loadId: "same-session-load",
      source: { kind: "https", url: "https://cdn.example.test/second.flac" },
    });
    player.emit(
      "position",
      makeSnapshot({ loadId: "same-session-load", positionMs: 999, token: 2 }),
    );

    expect(host.getSnapshot().positionMs).toBe(0);
    expect(delivered).toEqual(["state-changed", "loaded", "state-changed"]);
    completeReload();

    expect((await reloading).status).toBe("accepted");
    expect(host.getSnapshot().token).toBe(3);
  });

  test("does not let an older async load settle over a newer request", async () => {
    const player = new FakeNativeAudioPlayer();
    const host = createNativeAudioHost({ loader: createAvailableLoader(player) });
    const completions = new Map<string, (snapshot: NativeAudioSnapshot) => void>();
    player.load = (request: unknown) =>
      new Promise((resolve) => {
        const input = request as { loadId: string };
        completions.set(input.loadId, resolve);
      });

    const first = host.load({
      loadId: "load-a",
      source: { kind: "https", url: "https://cdn.example.test/a.flac" },
    });
    const second = host.load({
      loadId: "load-b",
      source: { kind: "https", url: "https://cdn.example.test/b.flac" },
    });

    completions.get("load-a")?.(makeSnapshot({ loadId: "load-a", phase: "paused", token: 2 }));
    expect(await first).toMatchObject({ reason: "native-load-superseded", status: "unavailable" });
    expect(host.getSnapshot()).toMatchObject({ loadId: "load-b", phase: "loading", token: null });

    completions.get("load-b")?.(makeSnapshot({ loadId: "load-b", phase: "paused", token: 3 }));
    expect(await second).toMatchObject({ status: "accepted" });
    expect(host.getSnapshot()).toMatchObject({ loadId: "load-b", phase: "paused", token: 3 });
  });

  test("disposal is idempotent and makes later commands unavailable", async () => {
    const player = new FakeNativeAudioPlayer();
    const host = createNativeAudioHost({ loader: createAvailableLoader(player) });
    const events: string[] = [];
    host.subscribe((event) => events.push(event.type));
    host.getAvailability();

    await host.dispose();
    await host.dispose();
    player.emit("position", makeSnapshot({ loadId: "old", positionMs: 1, token: 1 }));

    expect(player.disposeCount).toBe(1);
    expect(events).toEqual([]);
    expect(await host.play()).toEqual({
      diagnostic: "The native audio host has been disposed.",
      reason: "disposed",
      status: "unavailable",
    });
  });

  test("only admits absolute Windows files and HTTPS remote sources", async () => {
    const player = new FakeNativeAudioPlayer();
    const host = createNativeAudioHost({ loader: createAvailableLoader(player) });

    expect(
      await host.load({ loadId: "relative", source: { kind: "file", path: "song.flac" } }),
    ).toMatchObject({ reason: "invalid-input", status: "rejected" });
    expect(
      await host.load({
        loadId: "http",
        source: { kind: "https", url: "http://example.test/song" },
      }),
    ).toMatchObject({ reason: "invalid-input", status: "rejected" });
    expect(
      await host.load({
        loadId: "file",
        source: { kind: "file", path: "D:\\Music\\song.flac" },
      }),
    ).toMatchObject({ status: "accepted" });
  });
});

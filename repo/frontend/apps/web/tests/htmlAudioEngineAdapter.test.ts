import { describe, expect, test } from "bun:test";

import { createHtmlAudioEngineAdapter } from "@/lib/player/adapters/htmlAudioEngineAdapter";

class FakeAudioElement extends EventTarget {
  buffered = {
    end: () => 0,
    length: 0,
  };
  currentSrc = "";
  currentTime = 0;
  duration = Number.NaN;
  ended = false;
  error: MediaError | null = null;
  networkState = 0;
  ownerDocument = { baseURI: "https://scopify.test/" } as Document;
  paused = true;
  playbackRate = 1;
  readyState = 0;
  src = "";
  volume = 1;

  getAttribute(name: string): string | null {
    return name === "src" && this.src ? this.src : null;
  }

  load(): void {
    this.currentSrc = this.src;
    this.dispatchEvent(new Event("loadstart"));
  }

  async play(): Promise<void> {
    this.paused = false;
    this.dispatchEvent(new Event("playing"));
  }

  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  removeAttribute(name: string): void {
    if (name === "src") this.src = "";
  }
}

function asAudioElement(audio: FakeAudioElement): HTMLAudioElement {
  return audio as unknown as HTMLAudioElement;
}

describe("HtmlAudioEngineAdapter", () => {
  test("owns source assignment and translates DOM lifecycle events into engine events", async () => {
    const audio = new FakeAudioElement();
    const adapter = createHtmlAudioEngineAdapter(asAudioElement(audio));
    const events: string[] = [];
    adapter.subscribe((event) => events.push(`${event.type}:${event.revision}`));

    adapter.setRemoteSource("https://cdn.example.test/song.flac?token=secret", 7);
    expect(audio.src).toContain("song.flac");
    expect(adapter.isSourceLoading()).toBeTrue();

    audio.duration = 185_346 / 1_000;
    audio.readyState = 4;
    audio.dispatchEvent(new Event("canplay"));
    await adapter.play();
    audio.currentTime = 12.5;
    audio.dispatchEvent(new Event("timeupdate"));

    expect(adapter.getMediaSample()).toMatchObject({
      durationMs: 185_346,
      paused: false,
      positionMs: 12_500,
    });
    expect(events).toEqual(["loaded:7", "playing:7", "position:7"]);
    expect(adapter.getSourceHost()).toBe("cdn.example.test");

    await adapter.dispose();
  });

  test("load exposes the common engine contract and rejects a local source in Web", async () => {
    const audio = new FakeAudioElement();
    const adapter = createHtmlAudioEngineAdapter(asAudioElement(audio));
    const controller = new AbortController();

    const pendingLoad = adapter.load(
      {
        candidateId: "remote:1",
        kind: "remote",
        quality: "lossless",
        url: "https://cdn.example.test/song.flac",
      },
      { revision: 1, signal: controller.signal },
    );
    audio.duration = 90;
    audio.readyState = 4;
    audio.dispatchEvent(new Event("canplay"));

    await expect(pendingLoad).resolves.toEqual({ durationMs: 90_000, status: "loaded" });
    await expect(
      adapter.load(
        { candidateId: "local:1", kind: "local", path: "D:\\Music\\song.flac" },
        { revision: 2, signal: controller.signal },
      ),
    ).resolves.toEqual({
      reason: "html-audio-local-source-unsupported",
      retryable: false,
      status: "failed",
    });
    await adapter.dispose();
  });
});

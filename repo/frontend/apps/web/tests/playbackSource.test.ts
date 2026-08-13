import { describe, expect, test } from "bun:test";

import { isPlaybackSourceCurrent, waitForPlaybackSource } from "@/lib/player/playbackSource";

class FakeAudioElement extends EventTarget {
  currentSrc = "";
  error: MediaError | null = null;
  readonly ownerDocument = { baseURI: "https://app.scopify.test/" };
  readyState = 0;
  sourceAttribute: string | null = null;

  getAttribute(name: string) {
    return name === "src" ? this.sourceAttribute : null;
  }
}

describe("playback source identity", () => {
  test("does not let a newly declared URL impersonate an old current source", () => {
    const fake = new FakeAudioElement();
    fake.currentSrc = "https://cdn.test/old.mp3";
    fake.sourceAttribute = "https://cdn.test/new.mp3";

    expect(
      isPlaybackSourceCurrent(fake as unknown as HTMLAudioElement, "https://cdn.test/new.mp3"),
    ).toBeFalse();
  });

  test("waits until canplay belongs to the active load identity", async () => {
    const fake = new FakeAudioElement();
    const audio = fake as unknown as HTMLAudioElement;
    let current = true;
    const ready = waitForPlaybackSource(audio, "https://cdn.test/new.mp3", () => current, 100);

    fake.sourceAttribute = "https://cdn.test/new.mp3";
    fake.currentSrc = "https://cdn.test/old.mp3";
    fake.readyState = 4;
    fake.dispatchEvent(new Event("canplay"));

    fake.currentSrc = "https://cdn.test/new.mp3";
    fake.readyState = 2;
    fake.dispatchEvent(new Event("canplay"));
    expect(await ready).toBeTrue();

    current = false;
    await expect(
      waitForPlaybackSource(audio, "https://cdn.test/new.mp3", () => current, 100),
    ).resolves.toBeFalse();
  });
});

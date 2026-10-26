import { describe, expect, it } from "bun:test";
import { getMvResolutions, restoreMvQualityPlayback } from "@/lib/music/mvQuality";

describe("MV quality selection", () => {
  it("retains high resolutions, removes duplicates and rejects invalid values", () => {
    const resolutions = [720, 2160, 1080, 720, 0, -1, Number.NaN].map((br) => ({ br, size: 1 }));
    expect(getMvResolutions(resolutions, 1080)).toEqual([2160, 1080, 720]);
  });

  it("shows the actual stream resolution even without detail metadata", () => {
    expect(getMvResolutions([], 480)).toEqual([480]);
    expect(getMvResolutions([{ br: 1080, size: 1 }], 720)).toEqual([1080, 720]);
  });

  it("restores progress, volume, mute and speed without resuming a paused video", () => {
    let paused = false;
    const video = {
      currentTime: 0,
      duration: 100,
      volume: 1,
      muted: false,
      playbackRate: 1,
      pause: () => {
        paused = true;
      },
    };
    restoreMvQualityPlayback(video, {
      currentTime: 42,
      volume: 0.4,
      muted: true,
      playbackRate: 1.5,
      paused: true,
    });
    expect(video.currentTime).toBe(42);
    expect(video.volume).toBe(0.4);
    expect(video.muted).toBe(true);
    expect(video.playbackRate).toBe(1.5);
    expect(paused).toBe(true);
  });

  it("clamps restored progress and leaves playing streams unpaused", () => {
    let paused = false;
    const video = {
      currentTime: 0,
      duration: 30,
      volume: 1,
      muted: false,
      playbackRate: 1,
      pause: () => {
        paused = true;
      },
    };
    restoreMvQualityPlayback(video, {
      currentTime: 42,
      volume: 0.4,
      muted: false,
      playbackRate: 1,
      paused: false,
    });
    expect(video.currentTime).toBe(30);
    expect(paused).toBe(false);
  });
});

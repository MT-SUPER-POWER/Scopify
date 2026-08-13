import { describe, expect, test } from "bun:test";

import { getCompanionPlaybackPath } from "@/lib/playbackProjection/companionRoute";

describe("companion playback route detection", () => {
  test("recognizes regular and static-export trailing-slash paths", () => {
    expect(getCompanionPlaybackPath("/desktop-lyrics")).toBe("/desktop-lyrics");
    expect(getCompanionPlaybackPath("/desktop-lyrics/")).toBe("/desktop-lyrics");
    expect(getCompanionPlaybackPath("/desktop-wallpaper///")).toBe("/desktop-wallpaper");
    expect(getCompanionPlaybackPath("/desktop-playback-controller/")).toBe(
      "/desktop-playback-controller",
    );
    expect(getCompanionPlaybackPath("/tray/")).toBe("/tray");
  });

  test("does not install an Electron Replica around dashboard routes", () => {
    expect(getCompanionPlaybackPath("/")).toBeNull();
    expect(getCompanionPlaybackPath("/playlist/")).toBeNull();
    expect(getCompanionPlaybackPath("/app-close/")).toBeNull();
    expect(getCompanionPlaybackPath("/playback-host")).toBeNull();
    expect(getCompanionPlaybackPath("/playback-host/")).toBeNull();
  });
});

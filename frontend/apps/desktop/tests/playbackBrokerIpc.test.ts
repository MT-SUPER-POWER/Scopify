import { describe, expect, test } from "bun:test";

import {
  createOwnedPlaybackConnectionId,
  parsePlaybackConnectionRequest,
} from "@/main/module/playbackBroker/connectionRequest";

describe("playback broker IPC connection validation", () => {
  test("accepts only bounded role-tagged connection requests", () => {
    expect(
      parsePlaybackConnectionRequest({ connectionId: "main-authority", role: "authority" }),
    ).toEqual({ connectionId: "main-authority", role: "authority" });
    expect(
      parsePlaybackConnectionRequest({ connectionId: "desktop-lyrics", role: "replica" }),
    ).toEqual({ connectionId: "desktop-lyrics", role: "replica" });

    expect(parsePlaybackConnectionRequest(null)).toBeNull();
    expect(parsePlaybackConnectionRequest([])).toBeNull();
    expect(parsePlaybackConnectionRequest({ connectionId: "", role: "replica" })).toBeNull();
    expect(
      parsePlaybackConnectionRequest({ connectionId: "x".repeat(129), role: "replica" }),
    ).toBeNull();
    expect(
      parsePlaybackConnectionRequest({ connectionId: "desktop-lyrics", role: "publisher" }),
    ).toBeNull();
  });

  test("binds Broker connection ownership to the Electron sender", () => {
    expect(createOwnedPlaybackConnectionId("replica", 42)).toBe("replica:42");
    expect(createOwnedPlaybackConnectionId("authority", 7)).toBe("authority:7");
    expect(() => createOwnedPlaybackConnectionId("replica", -1)).toThrow("non-negative integer");
  });
});

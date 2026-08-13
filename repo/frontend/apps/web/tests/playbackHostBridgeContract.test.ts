import { describe, expect, test } from "bun:test";
import {
  parsePlaybackHostRendererReadyRequest,
  parsePlaybackHostMediaPlayingRequest,
  PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL,
  PLAYBACK_HOST_NONCE_MAX_LENGTH,
  PLAYBACK_HOST_RENDERER_READY_CHANNEL,
} from "@mt-super-power/desktop-contract";

describe("Playback Host bridge contract", () => {
  test("uses a dedicated ready channel and preserves a valid per-load nonce", () => {
    expect(PLAYBACK_HOST_RENDERER_READY_CHANNEL).toBe("playback-host:renderer-ready");
    expect(parsePlaybackHostRendererReadyRequest({ nonce: "load-a" })).toEqual({ nonce: "load-a" });
  });

  test("rejects renderer-ready payloads that cannot be verified by the main process", () => {
    expect(parsePlaybackHostRendererReadyRequest({})).toBeNull();
    expect(parsePlaybackHostRendererReadyRequest({ nonce: "" })).toBeNull();
    expect(
      parsePlaybackHostRendererReadyRequest({
        nonce: "a".repeat(PLAYBACK_HOST_NONCE_MAX_LENGTH + 1),
      }),
    ).toBeNull();
    expect(parsePlaybackHostRendererReadyRequest("load-a")).toBeNull();
  });

  test("accepts only a boolean host media-playing state on its dedicated channel", () => {
    expect(PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL).toBe("playback-host:media-playing");
    expect(parsePlaybackHostMediaPlayingRequest({ isPlaying: true })).toEqual({ isPlaying: true });
    expect(parsePlaybackHostMediaPlayingRequest({ isPlaying: false })).toEqual({
      isPlaying: false,
    });
    expect(parsePlaybackHostMediaPlayingRequest({ isPlaying: "true" })).toBeNull();
    expect(parsePlaybackHostMediaPlayingRequest({})).toBeNull();
    expect(parsePlaybackHostMediaPlayingRequest(null)).toBeNull();
  });
});

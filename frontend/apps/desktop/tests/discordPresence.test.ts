import { describe, expect, test } from "bun:test";

import {
  buildDiscordActivity,
  createDiscordPresenceController,
  getDiscordActivityKey,
  normalizeDiscordApplicationId,
  normalizeDiscordImageUrl,
} from "@/main/module/discordPresence";

describe("Discord Rich Presence", () => {
  test("accepts Discord snowflakes and rejects malformed IDs", () => {
    expect(normalizeDiscordApplicationId(" 123456789012345678 ")).toBe("123456789012345678");
    expect(normalizeDiscordApplicationId("not-an-application-id")).toBe("");
  });

  test("only allows externally reachable cover image URLs", () => {
    expect(normalizeDiscordImageUrl("http://example.com/cover.jpg")).toBe(
      "https://example.com/cover.jpg",
    );
    expect(normalizeDiscordImageUrl("http://127.0.0.1:3000/cover.jpg")).toBe("");
    expect(normalizeDiscordImageUrl("file:///cover.jpg")).toBe("");
  });

  test("maps active playback to a listening activity with a progress clock", () => {
    expect(
      buildDiscordActivity({
        album: "Album",
        artist: "Artist",
        coverUrl: "https://example.com/cover.jpg",
        durationMs: 120_000,
        isPlaying: true,
        positionMs: 30_000,
        sampledAtMs: 100_000,
        title: "Song",
      }),
    ).toMatchObject({
      details: "Song",
      largeImageKey: "https://example.com/cover.jpg",
      name: "Scopify",
      state: "Artist",
      type: 2,
    });
  });

  test("keeps title, subtitle, and cover caption distinct", () => {
    const activity = buildDiscordActivity({
      album: "Album",
      artist: "Song",
      coverUrl: "https://example.com/cover.jpg",
      durationMs: 120_000,
      isPlaying: true,
      positionMs: 30_000,
      sampledAtMs: 100_000,
      title: "Song",
    });

    expect(activity).toMatchObject({
      details: "Song",
      largeImageText: "Scopify",
      state: "Album",
    });
    expect(activity?.details).not.toBe(activity?.largeImageText);
    expect(activity?.details).not.toBe(activity?.state);
    expect(activity?.state).not.toBe(activity?.largeImageText);
  });

  test("normalizes visual variants before preventing duplicate activity text", () => {
    const activity = buildDiscordActivity({
      album: "Song",
      artist: " song ",
      coverUrl: "https://example.com/cover.jpg",
      durationMs: 120_000,
      isPlaying: true,
      positionMs: 30_000,
      sampledAtMs: 100_000,
      title: "Ｓｏｎｇ",
    });

    expect(activity).toMatchObject({
      largeImageText: "Scopify",
      state: "Scopify",
    });
  });

  test("keeps the activity identity stable while its clock advances", () => {
    const first = buildDiscordActivity({
      album: "Album",
      artist: "Artist",
      coverUrl: null,
      durationMs: 120_000,
      isPlaying: true,
      positionMs: 30_000,
      sampledAtMs: 100_000,
      title: "Song",
    });
    const second = buildDiscordActivity({
      album: "Album",
      artist: "Artist",
      coverUrl: null,
      durationMs: 120_000,
      isPlaying: true,
      positionMs: 31_000,
      sampledAtMs: 101_000,
      title: "Song",
    });

    expect(getDiscordActivityKey(first)).toBe(getDiscordActivityKey(second));
  });

  test("reports configuration errors through the explicit connection test", async () => {
    const controller = createDiscordPresenceController({
      getApplicationId: () => "not-a-discord-application-id",
      isEnabled: () => true,
    });

    await expect(controller.testConnection()).resolves.toMatchObject({
      configured: false,
      connected: false,
      enabled: true,
      error: "A valid Discord Application ID is required.",
    });
  });
});

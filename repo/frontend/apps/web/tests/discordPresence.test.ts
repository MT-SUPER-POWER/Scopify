import { describe, expect, test } from "bun:test";

import { buildDiscordPresenceArtist } from "@/lib/player/discordPresence";

describe("Discord Presence track metadata", () => {
  test("never repeats the track title in the activity subtitle", () => {
    expect(
      buildDiscordPresenceArtist({
        album: "Album",
        artistNames: ["Track", "  Artist  ", "Artist"],
        title: "Track",
      }),
    ).toBe("Artist");
  });

  test("uses album or Scopify when artist metadata would repeat the title", () => {
    expect(
      buildDiscordPresenceArtist({
        album: "Album",
        artistNames: ["Track"],
        title: "Track",
      }),
    ).toBe("Album");
    expect(
      buildDiscordPresenceArtist({
        album: "Track",
        artistNames: ["Track"],
        title: "Track",
      }),
    ).toBe("Scopify");
  });
});

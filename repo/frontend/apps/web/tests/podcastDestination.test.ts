import { expect, test } from "bun:test";

import { getPodcastDestination } from "@/lib/search/podcastDestination";

test("opens every podcast search result in its radio detail page", () => {
  expect(getPodcastDestination({ id: 1231333508, source: "dj-radio" })).toBe(
    "/radio?id=1231333508",
  );
  expect(getPodcastDestination({ id: 1231333508, source: "voice-list" })).toBe(
    "/radio?id=1231333508",
  );
});

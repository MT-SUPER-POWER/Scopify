import { expect, test } from "bun:test";

import { getPodcastContextMenuAction } from "@/components/shared/PodcastContextMenu";

test("shows pause for the podcast that is currently playing", () => {
  expect(getPodcastContextMenuAction(true, true)).toBe("pause");
  expect(getPodcastContextMenuAction(true, false)).toBe("play");
  expect(getPodcastContextMenuAction(false, true)).toBe("play");
});

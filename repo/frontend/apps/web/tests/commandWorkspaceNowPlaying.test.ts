import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(import.meta.dir, "../components/commandWorkspace/CommandWorkspaceNowPlaying.tsx"),
  "utf8",
);

test("renders rich now playing card with album cover, smooth sliders, and full controls", () => {
  expect(source).toContain("SmoothSlider");
  expect(source).toContain("currentSong.al?.picUrl");
  expect(source).toContain("navigateToArtist");
  expect(source).toContain("navigateToAlbum");
  expect(source).toContain("toggleShuffle");
  expect(source).toContain("cycleRepeat");
  expect(source).toContain("toggleLyrics");
  expect(source).toContain("handleToggleMute");
  expect(source).not.toContain('type="range"');
});

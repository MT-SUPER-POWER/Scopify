import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const playlistContentSource = readFileSync(
  fileURLToPath(new URL("../components/Playlist/PlaylistContent.tsx", import.meta.url)),
  "utf8",
);
const trackTableSource = readFileSync(
  fileURLToPath(new URL("../components/Playlist/TrackTable.tsx", import.meta.url)),
  "utf8",
);
const playlistTypesSource = readFileSync(
  fileURLToPath(new URL("../types/components/playlist.ts", import.meta.url)),
  "utf8",
);
const personalFmPageSource = readFileSync(
  fileURLToPath(new URL("../app/(dashboard)/personal-fm/page.tsx", import.meta.url)),
  "utf8",
);

test("Personal FM exposes its dislike action through the playlist table contract", () => {
  expect(playlistTypesSource).toContain("onDislikePersonalFm?: (track: SongDetail) => void;");
  expect(playlistContentSource).toContain("onDislikePersonalFm={onDislikePersonalFm}");
  expect(trackTableSource).toMatch(
    /onDislikePersonalFm=\{\s*onDislikePersonalFm\s*\?\s*\(\) => onDislikePersonalFm\(track\)\s*:\s*undefined\s*\}/,
  );
  expect(personalFmPageSource).toContain("onDislikePersonalFm={personalFm.onDislikeTrack}");
});

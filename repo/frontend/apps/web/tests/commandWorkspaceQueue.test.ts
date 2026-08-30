import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(import.meta.dir, "../components/commandWorkspace/CommandWorkspaceQueue.tsx"),
  "utf8",
);

test("supports drag and drop reordering and removes discrete up/down buttons", () => {
  expect(source).toContain("draggable");
  expect(source).toContain("onDragStart");
  expect(source).toContain("handleItemDragOver");
  expect(source).toContain("handleItemDrop");
  expect(source).toContain("handleContainerDrop");
  expect(source).toContain("GripVertical");
  expect(source).not.toContain("ChevronUp");
  expect(source).not.toContain("ChevronDown");
});

test("displays album cover art and links for artists and albums", () => {
  expect(source).toContain("track.al?.picUrl");
  expect(source).toContain("navigateToArtist(artist.id)");
  expect(source).toContain("navigateToAlbum(track.al.id)");
  expect(source).toContain("formatDuration(track.dt)");
});

test("synchronizes playback state and toggles play and pause on current track", () => {
  expect(source).toContain("handleTogglePlay");
  expect(source).toContain("isCurrentPlaying");
  expect(source).toContain("PlayingAnimation");
  expect(source).toContain("Pause");
  expect(source).toContain("setIsPlaying(!isPlaying)");
});

test("provides clean more options dropdown menu instead of loose action buttons", () => {
  expect(source).toContain("MoreHorizontal");
  expect(source).toContain("DropdownMenu");
  expect(source).toContain("从队列移除");
  expect(source).not.toContain("ListPlus");
});

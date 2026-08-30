import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const libraryNavigationSource = readFileSync(
  fileURLToPath(new URL("../components/Siderbar/LibraryNavigation.tsx", import.meta.url)),
  "utf8",
);
const sidebarLibrarySource = readFileSync(
  fileURLToPath(new URL("../components/Siderbar/SidebarPlaylistLibrary.tsx", import.meta.url)),
  "utf8",
);
const personalFmItemSource = readFileSync(
  fileURLToPath(new URL("../components/Siderbar/PersonalFmPlaylistItem.tsx", import.meta.url)),
  "utf8",
);
const personalFmPageSource = readFileSync(
  fileURLToPath(new URL("../app/(dashboard)/personal-fm/page.tsx", import.meta.url)),
  "utf8",
);
const playerBarSource = readFileSync(
  fileURLToPath(new URL("../components/PlayerBar.tsx", import.meta.url)),
  "utf8",
);
const personalFmControlPanelSource = readFileSync(
  fileURLToPath(new URL("../components/player/PersonalFmControlPanel.tsx", import.meta.url)),
  "utf8",
);
const personalFmSelectionTrackSource = readFileSync(
  fileURLToPath(new URL("../components/player/PersonalFmSelectionTrack.tsx", import.meta.url)),
  "utf8",
);
const personalFmPlaylistHookSource = readFileSync(
  fileURLToPath(new URL("../hooks/personalFm/usePersonalFmPlaylist.ts", import.meta.url)),
  "utf8",
);

test("Personal FM is presented as a virtual playlist instead of a library navigation item", () => {
  expect(libraryNavigationSource).not.toContain("PersonalFmNavigationItem");
  expect(sidebarLibrarySource).toContain(
    "{isLoggedIn && <PersonalFmPlaylistItem isCollapsed={isCollapsed} />}",
  );
  expect(personalFmItemSource).toContain('href="/personal-fm"');
  expect(personalFmItemSource).toContain("hasContextMenu={false}");
  expect(personalFmItemSource).toContain("getPersonalFmSelectionLabel(selection, t)");
});

test("Personal FM reuses the playlist detail surface and playback source", () => {
  expect(personalFmPageSource).toContain("<PlaylistContent");
  expect(personalFmPageSource).toContain(
    'actionSlot={<PersonalFmControlPanel placement="playlist" />}',
  );
  expect(personalFmPageSource).toContain("showShuffle={false}");
  expect(personalFmPageSource).toContain("readonly");
  expect(personalFmPlaylistHookSource).not.toContain("totalSongsLabel");
});

test("Personal FM keeps mode and scene selection in the PlayBar without Folia dependencies", () => {
  expect(playerBarSource).toContain("!isLyricStageBar && <PersonalFmControlPanel />");
  expect(personalFmControlPanelSource).toContain(
    'if (placement === "playbar" && !isPersonalFm) return null;',
  );
  expect(personalFmControlPanelSource).toContain("<PopoverContent");
  expect(personalFmControlPanelSource).not.toContain("Folia");
  expect(personalFmControlPanelSource).not.toContain("useLyricStageStore");
  expect(personalFmControlPanelSource).toContain(
    'align={placement === "playlist" ? "start" : "end"}',
  );
  expect(personalFmControlPanelSource).toContain('className="mb-4 flex justify-start"');
});

test("Personal FM uses a neutral icon-only trigger in both placements", () => {
  const personalFmControlTriggerSource = readFileSync(
    fileURLToPath(new URL("../components/player/PersonalFmControlTrigger.tsx", import.meta.url)),
    "utf8",
  );

  expect(personalFmControlTriggerSource).toContain("iconClassName");
  expect(personalFmControlTriggerSource).not.toContain("text-brand");
  expect(personalFmControlTriggerSource).not.toContain("bg-brand");
  expect(personalFmControlTriggerSource).not.toContain("selectionLabel");
});

test("Personal FM selection tracks are drag-scrollable without native scrollbars", () => {
  expect(personalFmControlPanelSource).toContain("<PersonalFmSelectionTrack>");
  expect(personalFmSelectionTrackSource).toContain("useHorizontalDragScroll");
  expect(personalFmSelectionTrackSource).toContain("scrollHandlers");
  expect(personalFmSelectionTrackSource).toContain("[scrollbar-width:none]");
});

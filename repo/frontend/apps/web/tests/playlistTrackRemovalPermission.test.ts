import { describe, expect, test } from "bun:test";

import { canRemoveTracksFromPlaylist } from "@/lib/playlist/playlistTrackRemovalPermission";

const ownedPlaylist = {
  creatorId: 42,
  currentUserId: 42,
  isDailyRecommendation: false,
  isHistoricalDailyRecommendation: false,
  isVirtualPlaylist: false,
  playlistId: "100",
  readonly: false,
};

describe("canRemoveTracksFromPlaylist", () => {
  test("allows removal only from a concrete playlist owned by the current user", () => {
    expect(canRemoveTracksFromPlaylist(ownedPlaylist)).toBe(true);
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        creatorId: "42",
        currentUserId: 42,
      }),
    ).toBe(true);
  });

  test("denies removal when the viewer is anonymous or the playlist belongs to somebody else", () => {
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        currentUserId: null,
      }),
    ).toBe(false);
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        creatorId: 7,
      }),
    ).toBe(false);
  });

  test("denies removal from daily, historical, virtual, readonly, and unresolved playlist contexts", () => {
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        isDailyRecommendation: true,
      }),
    ).toBe(false);
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        isHistoricalDailyRecommendation: true,
      }),
    ).toBe(false);
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        isVirtualPlaylist: true,
      }),
    ).toBe(false);
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        readonly: true,
      }),
    ).toBe(false);
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        creatorId: null,
      }),
    ).toBe(false);
    expect(
      canRemoveTracksFromPlaylist({
        ...ownedPlaylist,
        playlistId: null,
      }),
    ).toBe(false);
  });
});

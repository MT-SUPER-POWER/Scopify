import { describe, expect, it } from "bun:test";

import { radioBrowseRange, radioWallSlots } from "@/lib/playlist/lattice/radioWall";

describe("radio wall slots", () => {
  it("leaves an FM card for the next unknown track without letting browse select it", () => {
    const range = radioBrowseRange(3, 2, false);
    expect(range).toEqual({ min: 0, max: 2 });
    expect(radioWallSlots(2, 2, 3, range, true)).toEqual([
      { position: 0, trackIndex: 0 },
      { position: 1, trackIndex: 1 },
      { position: 2, trackIndex: 2 },
      { position: 3, trackIndex: null },
    ]);
  });

  it("wraps a short repeat queue without drawing the same queue position twice", () => {
    const range = radioBrowseRange(3, 0, true);
    expect(radioWallSlots(-1, 3, 3, range, false)).toEqual([
      { position: -2, trackIndex: 1 },
      { position: -1, trackIndex: 2 },
      { position: 0, trackIndex: 0 },
    ]);
  });

  it("keeps a bounded window even while browsing far from the current track", () => {
    const range = radioBrowseRange(100_000, 0, false);
    const slots = radioWallSlots(42_000, 4, 100_000, range, false);
    expect(slots).toHaveLength(9);
    expect(slots[4]).toEqual({ position: 42_000, trackIndex: 42_000 });
  });
});

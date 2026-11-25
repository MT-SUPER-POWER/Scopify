import { describe, expect, test } from "bun:test";
import {
  STANDARD_SPACING,
  columnsFor,
  dropIndexAt,
  gridHeight,
  previewSlots,
  rectFromPoints,
  rectsIntersect,
  slotPosition,
} from "@/lib/scratchpad/canvasLayout";
import { applyScratchpadQueueBatch, moveBlockToIndex } from "@/lib/scratchpad/queueBatch";
import type { PlayerTrack } from "@/types/player/model";

function trackOf(id: string): PlayerTrack {
  return {
    ref: { provider: "netease", kind: "track", id },
    title: `Song ${id}`,
    artists: [{ ref: { provider: "netease", kind: "artist", id: "1" }, name: "Artist" }],
    album: null,
    durationMs: 120000,
  };
}

describe("canvasLayout & queueBatch", () => {
  test("computes columns, slot positions, grid height, and drop index", () => {
    expect(columnsFor(100, STANDARD_SPACING)).toBe(1);
    expect(columnsFor(560, STANDARD_SPACING)).toBe(3);

    const p = slotPosition(4, 3, STANDARD_SPACING);
    expect(p.x).toBe(1 * (STANDARD_SPACING.card.width + STANDARD_SPACING.x));
    expect(p.y).toBe(1 * (STANDARD_SPACING.card.height + STANDARD_SPACING.y));

    expect(gridHeight(0, 3, STANDARD_SPACING)).toBe(0);
    expect(gridHeight(4, 3, STANDARD_SPACING)).toBe(
      2 * STANDARD_SPACING.card.height + STANDARD_SPACING.y,
    );

    expect(dropIndexAt(p, 3, 5, STANDARD_SPACING)).toBe(4);
    expect(dropIndexAt({ x: 9999, y: 9999 }, 3, 5, STANDARD_SPACING)).toBe(5);
  });

  test("previewSlots opens contiguous gap for dragged cards", () => {
    const slots = previewSlots(["a", "b", "c", "d", "e"], new Set(["a", "c"]), 2);
    expect(slots.get("b")).toBe(0);
    expect(slots.get("d")).toBe(1);
    expect(slots.get("e")).toBe(4);
    expect(slots.has("a")).toBe(false);
  });

  test("rectFromPoints and rectsIntersect handle reversed points", () => {
    const a = rectFromPoints({ x: 100, y: 100 }, { x: 20, y: 20 });
    const b = { left: 50, top: 50, right: 150, bottom: 150 };
    const c = { left: 101, top: 101, right: 150, bottom: 150 };
    expect(rectsIntersect(a, b)).toBe(true);
    expect(rectsIntersect(a, c)).toBe(false);
  });

  test("moveBlockToIndex and applyScratchpadQueueBatch lock playing item on remove", () => {
    const tracks = ["1", "2", "3", "4"].map(trackOf);
    expect(moveBlockToIndex(tracks, [0, 2], 2).map((t) => t.ref.id)).toEqual(["2", "4", "1", "3"]);

    const removed = applyScratchpadQueueBatch({
      queue: tracks,
      targetIndices: [1, 2],
      currentTrack: tracks[1],
      action: "remove",
    });
    expect(removed.affectedCount).toBe(1);
    expect(removed.nextQueue.map((t) => t.ref.id)).toEqual(["1", "2", "4"]);

    const nextResult = applyScratchpadQueueBatch({
      queue: tracks,
      targetIndices: [3],
      currentTrack: tracks[0],
      action: "next",
    });
    expect(nextResult.changed).toBe(true);
    expect(nextResult.nextQueue.map((t) => t.ref.id)).toEqual(["1", "4", "2", "3"]);
  });
});

import { describe, expect, test } from "bun:test";
import { groupPlaysByDay } from "@/lib/scratchpad/historyDays";
import {
  SCRATCHPAD_MAX_ENTRIES,
  appendScratchpadEntries,
  filterScratchpadEntries,
  groupScratchpadEntries,
  moveWithinGroup,
  recordLocalHistoryEntry,
  removeLocalHistoryKeys,
  removeScratchpadKeys,
} from "@/lib/scratchpad/scratchpadModel";
import type { MusicProvider } from "@scopify/music-domain/identity";
import type { PlayerTrack } from "@/types/player/model";

function makeTrack(
  id: string,
  provider: MusicProvider = "netease",
  title = `Track ${id}`,
): PlayerTrack {
  return {
    ref: { provider, kind: "track", id },
    title,
    artists: [{ ref: { provider, kind: "artist", id: `a-${id}` }, name: `Artist ${id}` }],
    album: {
      ref: { provider, kind: "album", id: `al-${id}` },
      title: `Album ${id}`,
      coverUrl: null,
    },
    durationMs: 180000,
  };
}

describe("scratchpadModel", () => {
  test("appendScratchpadEntries deduplicates, prepends newest, and caps capacity", () => {
    const t1 = makeTrack("1", "netease");
    const t2 = makeTrack("2", "qq");
    const t3 = makeTrack("3", "netease");

    const first = appendScratchpadEntries([], [t1, t1, t2], { label: "Test" }, 100);
    expect(first.added).toBe(2);
    expect(first.skipped).toBe(1);
    expect(first.entries.map((entry) => entry.track.ref.id)).toEqual(["1", "2"]);

    const second = appendScratchpadEntries(first.entries, [t2, t3], undefined, 200);
    expect(second.added).toBe(1);
    expect(second.skipped).toBe(1);
    expect(second.entries.map((entry) => entry.track.ref.id)).toEqual(["3", "1", "2"]);

    const bulk = Array.from({ length: SCRATCHPAD_MAX_ENTRIES + 5 }, (_, idx) =>
      makeTrack(`bulk-${idx}`),
    );
    const capped = appendScratchpadEntries([], bulk);
    expect(capped.entries).toHaveLength(SCRATCHPAD_MAX_ENTRIES);
  });

  test("groupScratchpadEntries and moveWithinGroup preserve other providers", () => {
    const initial = appendScratchpadEntries(
      [],
      [
        makeTrack("n1", "netease"),
        makeTrack("q1", "qq"),
        makeTrack("n2", "netease"),
        makeTrack("n3", "netease"),
        makeTrack("q2", "qq"),
      ],
    ).entries;

    const groups = groupScratchpadEntries(initial);
    expect(groups.map((g) => g.provider)).toEqual(["netease", "qq"]);
    expect(groups[0].entries.map((e) => e.track.ref.id)).toEqual(["n1", "n2", "n3"]);

    const moved = moveWithinGroup(initial, "netease", [initial[0].key], 2);
    expect(
      moved.filter((e) => e.track.ref.provider === "netease").map((e) => e.track.ref.id),
    ).toEqual(["n2", "n3", "n1"]);
    expect(moved.filter((e) => e.track.ref.provider === "qq").map((e) => e.track.ref.id)).toEqual([
      "q1",
      "q2",
    ]);
  });

  test("filterScratchpadEntries and removeScratchpadKeys work across metadata", () => {
    const entries = appendScratchpadEntries(
      [],
      [makeTrack("1", "netease", "Midnight Rain"), makeTrack("2", "qq", "Sunrise")],
      { label: "Daily Mix" },
    ).entries;

    expect(filterScratchpadEntries(entries, "rain", "all")).toHaveLength(1);
    expect(filterScratchpadEntries(entries, "daily mix", "qq")).toHaveLength(1);
    expect(filterScratchpadEntries(entries, "", "netease")).toHaveLength(1);

    const remaining = removeScratchpadKeys(entries, [entries[0].key]);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].track.ref.id).toBe("2");
  });

  test("recordLocalHistoryEntry and groupPlaysByDay keep newest first by day", () => {
    const now = new Date(2026, 10, 25, 14, 0, 0).getTime();
    const yesterday = new Date(2026, 10, 24, 18, 0, 0).getTime();
    const earlier = new Date(2026, 10, 20, 9, 0, 0).getTime();

    let history = recordLocalHistoryEntry([], makeTrack("1"), earlier);
    history = recordLocalHistoryEntry(history, makeTrack("2"), yesterday);
    history = recordLocalHistoryEntry(history, makeTrack("1"), now);
    expect(history).toHaveLength(2);
    expect(history[0].track.ref.id).toBe("1");

    const days = groupPlaysByDay(history, now);
    expect(days.map((d) => d.kind)).toEqual(["today", "yesterday"]);

    const cleaned = removeLocalHistoryKeys(history, [history[0].key]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].track.ref.id).toBe("2");
  });
});

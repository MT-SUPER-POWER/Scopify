import { describe, expect, it } from "bun:test";
import { selectFallbackSource } from "@/lib/query/fallbackSource";
import type { QueryFallbackSource } from "@/types/query/boundary";

function source(overrides: Partial<QueryFallbackSource<string[]>>): QueryFallbackSource<string[]> {
  return {
    data: undefined,
    error: null,
    isPending: false,
    isFetching: false,
    fetchStatus: "idle",
    ...overrides,
  };
}

describe("explicit alternate data sources", () => {
  it("uses an available backup when the primary fails", () => {
    const result = selectFallbackSource(
      [source({ error: new Error("primary") }), source({ data: ["backup"] })],
      (items) => items.length > 0,
    );
    expect(result.data).toEqual(["backup"]);
  });
  it("treats a successful empty source as data, not a failure", () => {
    expect(
      selectFallbackSource(
        [source({ data: [] }), source({ error: new Error() })],
        (items) => items.length > 0,
      ).data,
    ).toEqual([]);
  });
  it("waits for a pending backup instead of throwing the primary error", () => {
    expect(
      selectFallbackSource(
        [
          source({ error: new Error() }),
          source({ isPending: true, isFetching: true, fetchStatus: "fetching" }),
        ],
        (items) => items.length > 0,
      ).isPending,
    ).toBe(true);
  });
  it("throws the original error when all alternatives fail", () => {
    const error = new Error("primary failure");
    expect(() =>
      selectFallbackSource(
        [source({ error }), source({ error: new Error("backup") })],
        (items) => items.length > 0,
      ),
    ).toThrow(error);
  });
  it("keeps cached results during refetch errors and exposes paused work", () => {
    expect(
      selectFallbackSource(
        [source({ data: ["cached"], error: new Error() })],
        (items) => items.length > 0,
      ).data,
    ).toEqual(["cached"]);
    expect(
      selectFallbackSource(
        [source({ isPending: true, fetchStatus: "paused" })],
        (items) => items.length > 0,
      ).isPaused,
    ).toBe(true);
  });
});

import { describe, expect, it } from "bun:test";
import { getHomeLoadState } from "@/lib/home/loadState";

describe("home loading boundaries", () => {
  it("keeps cached content when its background refresh fails", () => {
    const state = getHomeLoadState([
      { id: "toplists", hasContent: true, isFetching: false, isError: true },
    ]);
    expect(state.isUnavailable).toBe(false);
    expect(state.failedSections).toEqual([]);
  });

  it("reports only missing failed sections when other content is available", () => {
    const state = getHomeLoadState([
      { id: "toplists", hasContent: true, isFetching: false, isError: false },
      { id: "voices", hasContent: false, isFetching: false, isError: true },
    ]);
    expect(state.isUnavailable).toBe(false);
    expect(state.failedSections.map(({ id }) => id)).toEqual(["voices"]);
  });

  it("does not replace visible content with a skeleton during a different request", () => {
    const state = getHomeLoadState([
      { id: "toplists", hasContent: true, isFetching: false, isError: false },
      { id: "playlists", hasContent: false, isFetching: true, isError: false },
    ]);
    expect(state.isLoading).toBe(false);
  });

  it("shows a page error when no content remains, even if another endpoint returned an empty success", () => {
    const state = getHomeLoadState([
      { id: "songs", hasContent: false, isFetching: false, isError: true },
      { id: "artists", hasContent: false, isFetching: false, isError: false },
    ]);
    expect(state.isUnavailable).toBe(true);
  });

  it("waits for pending requests before declaring the page unavailable", () => {
    const state = getHomeLoadState([
      { id: "songs", hasContent: false, isFetching: false, isError: true },
      { id: "artists", hasContent: false, isFetching: true, isError: false },
    ]);
    expect(state.isLoading).toBe(true);
    expect(state.isUnavailable).toBe(false);
  });

  it("counts account content and does not label a successful empty page as a network error", () => {
    const sections = [
      { id: "songs" as const, hasContent: false, isFetching: false, isError: true },
    ];
    expect(getHomeLoadState(sections, true).isUnavailable).toBe(false);
    expect(getHomeLoadState([]).isUnavailable).toBe(false);
  });
});

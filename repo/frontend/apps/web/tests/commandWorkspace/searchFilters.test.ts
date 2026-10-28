import { describe, expect, it } from "bun:test";
import { COMMAND_WORKSPACE_SEARCH_FILTERS } from "@/constants/commandWorkspace";
import {
  buildCommandWorkspaceSearchHref,
  getCommandWorkspaceSearchFilterForCategory,
  resolveCommandWorkspaceSearchEntry,
} from "@/lib/commandWorkspace/search";
import { CATEGORIES } from "@/types/search/model";

describe("command workspace search constraints", () => {
  it("covers every search-page tab in the same order", () => {
    expect(COMMAND_WORKSPACE_SEARCH_FILTERS.map((filter) => filter.category)).toEqual(
      CATEGORIES.filter((category) => category !== "All"),
    );
    expect(new Set(COMMAND_WORKSPACE_SEARCH_FILTERS.map((filter) => filter.token)).size).toBe(
      COMMAND_WORKSPACE_SEARCH_FILTERS.length,
    );
  });

  it.each([
    ["Lyrics", "@lyric"],
    ["Sheets", "@sheet"],
    ["MVs", "@mv"],
  ] as const)("routes %s constraints to their matching tab", (category, token) => {
    const filter = getCommandWorkspaceSearchFilterForCategory(category);
    expect(filter?.token).toBe(token);
    expect(buildCommandWorkspaceSearchHref("Rubia", filter)).toBe(
      `/search?keywords=Rubia&tab=${category}`,
    );
  });

  it("keeps the existing episode token while matching the Voices tab label", () => {
    expect(getCommandWorkspaceSearchFilterForCategory("Voices")).toMatchObject({
      label: "声音",
      token: "@episode",
    });
  });

  it("applies the selected constraint even when choosing a recent search", () => {
    const filter = getCommandWorkspaceSearchFilterForCategory("Sheets");
    expect(
      resolveCommandWorkspaceSearchEntry({ category: "Songs", keyword: "Rubia" }, filter),
    ).toEqual({ category: "Sheets", keyword: "Rubia" });
  });

  it("preserves recent categories without a constraint and defaults text to All", () => {
    expect(resolveCommandWorkspaceSearchEntry({ category: "Lyrics", keyword: "雨" }, null)).toEqual(
      { category: "Lyrics", keyword: "雨" },
    );
    expect(resolveCommandWorkspaceSearchEntry("Rubia", null)).toEqual({
      category: "All",
      keyword: "Rubia",
    });
  });
});

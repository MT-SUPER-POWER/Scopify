import { expect, test } from "bun:test";
import { COMMAND_WORKSPACE_SEARCH_FILTERS } from "@/constants/commandWorkspace";
import {
  buildCommandWorkspaceSearchHref,
  getCommandWorkspaceCategory,
} from "@/lib/commandWorkspace/search";

test("keeps plain command-workspace searches on the existing all-results route", () => {
  expect(buildCommandWorkspaceSearchHref("Jay Chou", null)).toBe("/search?keywords=Jay+Chou");
  expect(getCommandWorkspaceCategory(null)).toBe("All");
});

test("maps a selected @ token to the matching existing search tab", () => {
  const artistFilter = COMMAND_WORKSPACE_SEARCH_FILTERS.find(
    (filter) => filter.token === "@artist",
  );

  expect(artistFilter).toBeDefined();
  expect(getCommandWorkspaceCategory(artistFilter ?? null)).toBe("Artists");
  expect(buildCommandWorkspaceSearchHref("Jay Chou", artistFilter ?? null)).toBe(
    "/search?keywords=Jay+Chou&tab=Artists",
  );
});

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommandWorkspaceRecentSearchRow } from "@/components/commandWorkspace/CommandWorkspaceRecentSearchRow";
import { COMMAND_WORKSPACE_SEARCH_FILTERS } from "@/constants/commandWorkspace";
import {
  buildCommandWorkspaceSearchHref,
  getCommandWorkspaceSearchFilterForCategory,
  getCommandWorkspaceCategory,
} from "@/lib/commandWorkspace/search";

const directSearchSource = readFileSync(
  resolve(import.meta.dir, "../components/commandWorkspace/CommandWorkspaceDirectSearch.tsx"),
  "utf8",
);
const headerSearchSource = readFileSync(
  resolve(import.meta.dir, "../components/SearchContents/HeaderSearch.tsx"),
  "utf8",
);

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
  expect(getCommandWorkspaceSearchFilterForCategory("Artists")?.token).toBe("@artist");
  expect(buildCommandWorkspaceSearchHref("Jay Chou", artistFilter ?? null)).toBe(
    "/search?keywords=Jay+Chou&tab=Artists",
  );
});

test("keeps a selected @ filter while drafting a direct search", () => {
  expect(directSearchSource).toContain("const [query, setQuery] = useState(initialQuery);");
  expect(directSearchSource).toContain("setGlobalQuery(keyword);");
  expect(directSearchSource).not.toContain("setGlobalQuery(nextQuery);");
  expect(directSearchSource).not.toContain("setFilter(null);");
});

test("shows the recorded @ token beside a categorized recent search", () => {
  const markup = renderToStaticMarkup(
    createElement(CommandWorkspaceRecentSearchRow, {
      item: { category: "Artists", keyword: "Sorrow" },
      onRemove: () => undefined,
      onSubmit: () => undefined,
      selected: false,
    }),
  );

  expect(markup).toContain("Sorrow");
  expect(markup).toContain("@artist");
  expect(markup).toContain("absolute top-1/2 right-3.5");
  expect(markup).toContain("group-hover:opacity-0");
});

test("clears header search selection when the pointer leaves a result row", () => {
  expect(headerSearchSource).toContain("onMouseLeave={() => setSelectedIndex(-1)}");
});

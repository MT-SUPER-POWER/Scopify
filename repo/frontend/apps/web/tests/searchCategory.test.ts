import { expect, test } from "bun:test";

import {
  buildSearchCategoryUrl,
  buildSearchUrl,
  getSearchCategory,
} from "@/lib/search/searchCategory";

test("restores a selected search category from the URL", () => {
  expect(getSearchCategory("Podcasts")).toBe("Podcasts");
  expect(getSearchCategory("unknown")).toBe("All");
});

test("keeps search keywords while updating the selected category", () => {
  expect(buildSearchCategoryUrl("keywords=Jay+Chou", "Podcasts")).toBe(
    "/search?keywords=Jay+Chou&tab=Podcasts",
  );
  expect(buildSearchCategoryUrl("keywords=Jay+Chou&tab=Podcasts", "All")).toBe(
    "/search?keywords=Jay+Chou",
  );
});

test("builds a recent search URL that restores its recorded category", () => {
  expect(buildSearchUrl("Sorrow", "Artists")).toBe("/search?keywords=Sorrow&tab=Artists");
  expect(buildSearchUrl("Sorrow")).toBe("/search?keywords=Sorrow");
});

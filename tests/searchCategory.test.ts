import { expect, test } from "bun:test";

import { buildSearchCategoryUrl, getSearchCategory } from "@/lib/search/searchCategory";

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

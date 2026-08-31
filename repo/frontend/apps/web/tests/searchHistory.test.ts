import { expect, test } from "bun:test";
import { normalizeSearchRecentEntries, upsertSearchRecentEntry } from "@/lib/search/searchHistory";

test("migrates legacy keyword-only search history to the all-results category", () => {
  expect(
    normalizeSearchRecentEntries(["Sorrow", { category: "Artists", keyword: "Unhappy" }]),
  ).toEqual([
    { category: "All", keyword: "Sorrow" },
    { category: "Artists", keyword: "Unhappy" },
  ]);
});

test("updates the category for an existing keyword without duplicating it", () => {
  const recent = upsertSearchRecentEntry([{ category: "Songs", keyword: "Sorrow" }], {
    category: "Artists",
    keyword: "Sorrow",
  });

  expect(recent).toEqual([{ category: "Artists", keyword: "Sorrow" }]);
});

test("moves an identical categorized search to the front without duplicating it", () => {
  const recent = upsertSearchRecentEntry(
    [
      { category: "Artists", keyword: "Unhappy" },
      { category: "Songs", keyword: "Sorrow" },
    ],
    { category: "Songs", keyword: "Sorrow" },
  );

  expect(recent).toEqual([
    { category: "Songs", keyword: "Sorrow" },
    { category: "Artists", keyword: "Unhappy" },
  ]);
});

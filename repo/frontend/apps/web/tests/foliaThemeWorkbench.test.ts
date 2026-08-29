import { expect, test } from "bun:test";

import { areFoliaThemesEqual } from "@/lib/lyrics/foliaThemeDraft";
import { createFoliaStageTheme } from "@scopify/ui/folia";

test("detects unsaved theme name and palette changes", () => {
  const saved = createFoliaStageTheme("Saved theme");

  expect(areFoliaThemesEqual(saved, structuredClone(saved))).toBe(true);
  expect(areFoliaThemesEqual(saved, { ...saved, name: "Draft name" })).toBe(false);
  expect(
    areFoliaThemesEqual(saved, {
      ...saved,
      dark: { ...saved.dark, accentColor: "#ff3366" },
    }),
  ).toBe(false);
});

import { describe, expect, test } from "bun:test";

import {
  createBuiltinFoliaStageThemes,
  getFoliaStageTheme,
  getThemePresetById,
  normalizeFoliaStageTheme,
  parseFoliaStageThemeJson,
} from "../folia";

describe("Folia theme model", () => {
  test("returns isolated copies of builtin themes", () => {
    const first = createBuiltinFoliaStageThemes();
    const second = createBuiltinFoliaStageThemes();

    first[0].dark.accentColor = "#000000";

    expect(second[0].dark.accentColor).toBe("#f4f4f5");
  });

  test("falls back to the first available theme", () => {
    const themes = createBuiltinFoliaStageThemes();

    expect(getFoliaStageTheme(themes, "missing").id).toBe(themes[0].id);
  });

  test("normalizes invalid values against the fallback", () => {
    const fallback = createBuiltinFoliaStageThemes()[0];
    const theme = normalizeFoliaStageTheme({
      dark: { ...fallback.dark, accentColor: "invalid" },
      id: "custom",
      light: fallback.light,
      name: " Custom ",
    });

    expect(theme.dark.accentColor).toBe(fallback.dark.accentColor);
    expect(theme.name).toBe("Custom");
  });

  test("rejects an imported theme without complete light and dark colors", () => {
    expect(parseFoliaStageThemeJson('{"name":"Incomplete"}')).toBeNull();
  });

  test("falls back to the default visualizer preset", () => {
    expect(getThemePresetById("missing").id).toBe("midnight");
  });
});

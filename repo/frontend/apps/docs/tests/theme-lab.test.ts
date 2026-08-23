import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { SCOPIFY_THEME_TOKENS, SHADCN_THEME_TOKENS } from "@/constants/theme-lab";
import {
  createBuiltInThemeRecords,
  generateThemeArtifacts,
  normalizeColorToHex,
  normalizeThemeId,
} from "@/lib/theme-lab";
import type { ThemeDraft, ThemeTokenDefinition, ThemeTokenValues } from "@/types/theme-lab";

const valuesFor = (definitions: readonly ThemeTokenDefinition[], suffix: string) =>
  Object.fromEntries(
    definitions.map(({ name }) => [name, `${name}-${suffix}`]),
  ) as ThemeTokenValues;

const draft: ThemeDraft = {
  dark: valuesFor([...SHADCN_THEME_TOKENS, ...SCOPIFY_THEME_TOKENS], "dark"),
  light: valuesFor([...SHADCN_THEME_TOKENS, ...SCOPIFY_THEME_TOKENS], "light"),
};

describe("theme lab", () => {
  test("registers both built-in theme profiles", () => {
    const requestedProfiles: Array<{ id: string; tokenNames: string[] }> = [];
    const records = createBuiltInThemeRecords((id, definitions) => {
      requestedProfiles.push({
        id,
        tokenNames: definitions.map(({ name }) => name),
      });

      return {
        dark: valuesFor(definitions, "dark"),
        light: valuesFor(definitions, "light"),
      };
    });

    expect(records.map(({ id }) => id)).toEqual(["shadcn-default", "scopify-default"]);
    expect(requestedProfiles[1]?.tokenNames).toContain("--background");
    expect(requestedProfiles[1]?.tokenNames).toContain("--scopify-success");
  });

  test("normalizes a safe data-theme id", () => {
    expect(normalizeThemeId("  Ocean / Night  ")).toBe("ocean-night");
    expect(normalizeThemeId("***")).toBe("custom-theme");
  });

  test("normalizes editable theme colors to hex", () => {
    expect(normalizeColorToHex("oklch(1 0 0)")).toBe("#ffffff");
    expect(normalizeColorToHex("oklch(0 0 0)")).toBe("#000000");
    expect(normalizeColorToHex("rgb(29 185 84)")).toBe("#1db954");
    expect(normalizeColorToHex("#abc")).toBe("#aabbcc");
  });

  test("exports one standard profile for Shadcn", () => {
    const artifacts = generateThemeArtifacts("shadcn", draft, "ocean");
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]?.label).toBe("themes/shadcn/ocean.css");
    expect(artifacts[0]?.css).toContain('[data-theme="ocean"].dark');
    expect(artifacts[0]?.css).not.toContain("--scopify-");
  });

  test("exports separate base and extension profiles for Scopify", () => {
    const artifacts = generateThemeArtifacts("scopify", draft, "ocean");
    expect(artifacts.map(({ label }) => label)).toEqual([
      "themes/shadcn/ocean.css",
      "themes/scopify/ocean.css",
    ]);
    expect(artifacts[0]?.css).not.toContain("--scopify-");
    expect(artifacts[1]?.css).not.toContain("--background:");
    expect(artifacts[1]?.css).toContain("--scopify-success:");
  });

  test("keeps editor metadata aligned with the Scopify profile", async () => {
    const profilePath = resolve(
      import.meta.dir,
      "../../../packages/ui/themes/scopify/scopify-default.css",
    );
    const profile = await Bun.file(profilePath).text();
    const declared = [...profile.matchAll(/(--scopify-[a-z0-9-]+)\s*:/g)].map((match) => match[1]);
    expect([...new Set(declared)].sort()).toEqual(
      SCOPIFY_THEME_TOKENS.map(({ name }) => name).sort(),
    );
  });

  test("keeps the Shadcn default profile in hex", async () => {
    const profilePath = resolve(
      import.meta.dir,
      "../../../packages/ui/themes/shadcn/shadcn-default.css",
    );
    const profile = await Bun.file(profilePath).text();
    expect(profile).toContain("--background: #ffffff;");
    expect(profile).toContain("--border: #ffffff1a;");
    expect(profile).not.toContain("oklch(");
  });
});

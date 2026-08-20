import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "bun:test";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readPackageFile(path: string) {
  return readFileSync(resolve(packageDirectory, path), "utf8");
}

const scopifyBridge = readPackageFile("scopify/theme.css");
const scopifyDefaultTheme = readPackageFile("themes/scopify/scopify-default.css");
const scopifyShadcnTheme = readPackageFile("themes/shadcn/scopify-default.css");
const themesIndex = readPackageFile("themes/index.css");

const SHARED_SHADCN_MAPPINGS = {
  brand: "primary",
  "brand-foreground": "primary-foreground",
  content: "foreground",
  "content-muted": "muted-foreground",
  danger: "destructive",
  surface: "background",
  "surface-elevated": "secondary",
  "surface-overlay": "popover",
  "surface-raised": "card",
  "surface-sunken": "accent",
} as const;

describe("Scopify theme layers", () => {
  test("keeps the built-in base theme on the shadcn token contract", () => {
    expect(scopifyShadcnTheme).toContain('[data-theme="scopify-default"]');
    expect(scopifyShadcnTheme).toContain("--background:");
    expect(scopifyShadcnTheme).toContain("--primary:");
    expect(scopifyShadcnTheme).toContain("--sidebar:");
    expect(scopifyShadcnTheme).not.toContain("--scopify-");
  });

  test("maps shared Scopify utilities directly to shadcn tokens", () => {
    for (const [utility, shadcnToken] of Object.entries(SHARED_SHADCN_MAPPINGS)) {
      expect(scopifyBridge).toContain(`--color-${utility}: var(--${shadcnToken});`);
    }
  });

  test("does not load a compatibility or fallback layer", () => {
    expect(scopifyBridge).not.toContain("compatibility.css");
    expect(scopifyBridge).not.toContain("extensions.css");
  });

  test("requires the Scopify profile to cover every extension token", () => {
    const requiredTokens = new Set(
      [...scopifyBridge.matchAll(/var\(--(scopify-[a-z0-9-]+)\)/g)].map((match) => match[1]),
    );
    const declaredTokens = new Set(
      [...scopifyDefaultTheme.matchAll(/\s--(scopify-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
    );

    expect(requiredTokens.size).toBeGreaterThan(0);
    expect([...requiredTokens].filter((token) => !declaredTokens.has(token))).toEqual([]);
  });

  test("keeps every profile-specific extension namespaced", () => {
    const declarations = [...scopifyDefaultTheme.matchAll(/\s--([a-z0-9-]+)\s*:/g)].map(
      (match) => match[1],
    );

    expect(declarations.length).toBeGreaterThan(0);
    expect(declarations.every((token) => token.startsWith("scopify-"))).toBe(true);
  });

  test("loads the complete Scopify profile after its shadcn base", () => {
    expect(themesIndex.indexOf("./shadcn/scopify-default.css")).toBeLessThan(
      themesIndex.indexOf("./scopify/scopify-default.css"),
    );
  });
});

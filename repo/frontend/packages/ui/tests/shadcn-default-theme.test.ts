import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "bun:test";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const aggregateTheme = readFileSync(resolve(packageDirectory, "theme.css"), "utf8");
const themesIndex = readFileSync(resolve(packageDirectory, "themes/index.css"), "utf8");
const shadcnDefaultTheme = readFileSync(
  resolve(packageDirectory, "themes/shadcn/shadcn-default.css"),
  "utf8",
);

const SHADCN_THEME_TOKENS = [
  "radius",
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

function readRule(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = shadcnDefaultTheme.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "s"));

  expect(match).not.toBeNull();
  return match?.[1] ?? "";
}

describe("shadcn default theme", () => {
  test("defines the complete light token contract", () => {
    const rule = readRule('[data-theme="shadcn-default"]');

    for (const token of SHADCN_THEME_TOKENS) {
      expect(rule).toContain(`--${token}:`);
    }
  });

  test("overrides every mode-specific token in dark mode", () => {
    const rule = readRule('[data-theme="shadcn-default"].dark');

    for (const token of SHADCN_THEME_TOKENS) {
      if (token !== "radius") {
        expect(rule).toContain(`--${token}:`);
      }
    }
  });

  test("is registered through the aggregate themes entry", () => {
    expect(aggregateTheme.indexOf("./scopify/theme.css")).toBeLessThan(
      aggregateTheme.indexOf("./themes/index.css"),
    );
    expect(themesIndex).toContain('@import "./shadcn/shadcn-default.css";');
  });
});

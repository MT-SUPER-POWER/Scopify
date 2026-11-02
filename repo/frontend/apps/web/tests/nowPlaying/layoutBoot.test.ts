import { expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { createLayoutBootScript } from "@/lib/layout/layoutBootScript";

function boot(wide: boolean, stored: Record<string, string> = {}) {
  const attributes = new Map<string, string>();
  runInNewContext(createLayoutBootScript(), {
    document: {
      documentElement: {
        style: { setProperty() {} },
        setAttribute: (name: string, value: string) => attributes.set(name, value),
      },
    },
    window: {
      localStorage: { getItem: (key: string) => stored[key] ?? null },
      matchMedia: () => ({ matches: wide }),
    },
  });
  return attributes.get("data-boot-now-playing");
}

test("fresh installs reserve the now-playing panel before hydration without a saved song", () => {
  expect(boot(true)).toBe("panel");
});

test("an empty player still respects the saved collapsed panel preference", () => {
  expect(
    boot(true, {
      "ui-storage": JSON.stringify({ state: { isNowPlayingPanelOpen: false } }),
    }),
  ).toBe("rail");
});

test("narrow windows leave space for the main content", () => {
  expect(boot(false)).toBe("none");
});

import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  LANDING_FONT_FILE,
  LANDING_GLYPHS_FILE,
  LANDING_GLYPH_SOURCES,
  collectLandingGlyphs,
} from "@/lib/marketing/landing-font-glyphs";

const APP_DIR = resolve(import.meta.dir, "..");

const readLandingSources = async () => {
  const componentDir = join(APP_DIR, LANDING_GLYPH_SOURCES.componentDir);
  const components = (await readdir(componentDir))
    .filter((name) => name.startsWith(LANDING_GLYPH_SOURCES.componentPrefix))
    .map((name) => join(componentDir, name));
  const files = [...components, ...LANDING_GLYPH_SOURCES.files.map((file) => join(APP_DIR, file))];
  return Promise.all(files.map((file) => Bun.file(file).text()));
};

describe("landing title font", () => {
  test("ships the committed woff2 subset", async () => {
    const font = Bun.file(join(APP_DIR, LANDING_FONT_FILE));
    expect(await font.exists()).toBe(true);
    expect(new TextDecoder().decode(await font.slice(0, 4).arrayBuffer())).toBe("wOF2");
  });

  test("covers every character in the landing copy", async () => {
    const needed = collectLandingGlyphs(await readLandingSources());
    const covered = new Set(await Bun.file(join(APP_DIR, LANDING_GLYPHS_FILE)).text());
    const missing = [...needed].filter((char) => !covered.has(char)).join("");
    // 文案新增了子集里没有的字：运行 pnpm --filter @scopify/docs generate:landing-font 重新生成。
    expect(missing).toBe("");
  });
});

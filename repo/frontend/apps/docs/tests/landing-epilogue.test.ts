import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const readSource = (relativePath: string) =>
  readFile(join(import.meta.dir, "..", relativePath), "utf8");

describe("landing epilogue", () => {
  test("closes with concrete product details and project entrances", async () => {
    const source = await readSource("components/marketing/landing-epilogue.tsx");

    expect(source).toContain("网易云音乐");
    expect(source).toContain("Folia");
    expect(source).toContain("桌面端");
    expect(source).toContain('href="/docs"');
    expect(source).toContain("LANDING_GITHUB_URL");
  });
});

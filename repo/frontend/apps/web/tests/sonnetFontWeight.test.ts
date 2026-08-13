import { describe, expect, test } from "bun:test";

import { resolveSonnetRoleFontWeight } from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetTypographyRoles";

describe("Sonnet font weight", () => {
  test("keeps designed role weights in auto mode", () => {
    expect(resolveSonnetRoleFontWeight(undefined, "support")).toBe(700);
    expect(resolveSonnetRoleFontWeight(undefined, "hero")).toBe(900);
    expect(resolveSonnetRoleFontWeight(null, "semi-hero")).toBe(900);
    expect(resolveSonnetRoleFontWeight(null, "decoration")).toBe(300);
  });

  test("uses and clamps the global manual override for every role", () => {
    expect(resolveSonnetRoleFontWeight(520, "support")).toBe(520);
    expect(resolveSonnetRoleFontWeight(520, "hero")).toBe(520);
    expect(resolveSonnetRoleFontWeight(520, "decoration")).toBe(520);
    expect(resolveSonnetRoleFontWeight(950, "hero")).toBe(900);
  });
});

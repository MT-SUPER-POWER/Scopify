import { expect, test } from "bun:test";

import { resolveNomandInverted } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/nomand/nomandColorMode";

test("reverses palette sampling only for daylight generated-color backgrounds", () => {
  expect(resolveNomandInverted(false, false, false)).toBe(false);
  expect(resolveNomandInverted(true, false, false)).toBe(true);
  expect(resolveNomandInverted(false, true, false)).toBe(true);
  expect(resolveNomandInverted(true, true, false)).toBe(false);
  expect(resolveNomandInverted(false, true, true)).toBe(false);
  expect(resolveNomandInverted(true, true, true)).toBe(true);
});

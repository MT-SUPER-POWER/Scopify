import { expect, test } from "bun:test";

import { shouldForwardExternalSessionPhase } from "@/lib/player/externalSessionPhase";

test("does not persist a transient pause emitted while a Host media source is replacing", () => {
  expect(shouldForwardExternalSessionPhase("paused", true)).toBeFalse();
  expect(shouldForwardExternalSessionPhase("paused", false)).toBeTrue();
  expect(shouldForwardExternalSessionPhase("playing", true)).toBeTrue();
  expect(shouldForwardExternalSessionPhase("error", true)).toBeTrue();
});

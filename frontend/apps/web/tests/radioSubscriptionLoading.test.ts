import { expect, test } from "bun:test";

import { isRadioSubscriptionLoading } from "@/hooks/radio/useRadioData";

test("does not disable the favorite button while a logged-in session lacks a hydrated user ID", () => {
  expect(isRadioSubscriptionLoading(true, undefined, true)).toBeFalse();
  expect(isRadioSubscriptionLoading(true, 42, true)).toBeTrue();
});

import { expect, test } from "bun:test";

import { getRememberedAppCloseAction } from "@/lib/runtime/appClose";

test("cancelling app close never produces a persisted close preference", () => {
  expect(getRememberedAppCloseAction("cancel")).toBeNull();
  expect(getRememberedAppCloseAction("minimize")).toBe(0);
  expect(getRememberedAppCloseAction("exit")).toBe(1);
});

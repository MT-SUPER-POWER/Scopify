import { describe, expect, test } from "bun:test";
import { createMainWindowRenderingPolicy } from "../electron/main/window/mainWindowRendering";

function createPolicy() {
  const calls: boolean[] = [];
  const policy = createMainWindowRenderingPolicy({
    setBackgroundThrottling: (allowed) => calls.push(allowed),
  });
  return { calls, policy };
}

describe("createMainWindowRenderingPolicy", () => {
  test("suspends frames only after the window is hidden and restores them on show", () => {
    const { calls, policy } = createPolicy();
    policy.setKeepAlive(false);
    expect(calls).toEqual([]);

    policy.hidden();
    policy.shown();
    expect(calls).toEqual([true, false]);
  });

  test("keeps a hidden window rendering while the wallpaper is enabled", () => {
    const { calls, policy } = createPolicy();
    policy.setKeepAlive(true);
    policy.hidden();
    expect(calls).toEqual([]);

    policy.setKeepAlive(false);
    policy.setKeepAlive(true);
    expect(calls).toEqual([true, false]);
  });

  test("does not repeat throttling changes for repeated events", () => {
    const { calls, policy } = createPolicy();
    policy.hidden();
    policy.hidden();
    policy.shown();
    policy.shown();
    expect(calls).toEqual([true, false]);
  });
});

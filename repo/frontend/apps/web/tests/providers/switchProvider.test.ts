import { expect, mock, test } from "bun:test";

import type { MusicProvider } from "@scopify/music-domain/identity";
import type { ProviderSwitchSteps } from "@/types/music/provider";

mock.module("@/lib/query/persister", () => ({ queryPersister: {} }));
mock.module("@/lib/runtime", () => ({ runtime: { isDesktop: false } }));
mock.module("@/store/module/player", () => ({ usePlayerStore: {} }));
mock.module("@/store/module/provider", () => ({ useActiveProviderStore: {} }));

const { switchProvider } = await import("@/lib/providers/switchProvider");

function recordingSteps(active: MusicProvider) {
  const calls: string[] = [];
  const steps: ProviderSwitchSteps = {
    getActiveProvider: () => active,
    stopPlayback: () => calls.push("stopPlayback"),
    clearCaches: async () => {
      await Promise.resolve();
      calls.push("clearCaches");
    },
    goHome: () => calls.push("goHome"),
    setActiveProvider: (provider) => calls.push(`setActiveProvider:${provider}`),
  };
  return { calls, steps };
}

test("stops playback, clears caches and routes home before changing the platform", async () => {
  const { calls, steps } = recordingSteps("netease");

  expect(await switchProvider("qq", steps)).toBe(true);
  expect(calls).toEqual(["stopPlayback", "clearCaches", "goHome", "setActiveProvider:qq"]);
});

test("only routes home when the platform is already active", async () => {
  const { calls, steps } = recordingSteps("qq");

  expect(await switchProvider("qq", steps)).toBe(false);
  expect(calls).toEqual(["goHome"]);
});

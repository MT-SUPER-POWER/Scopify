import { expect, test } from "bun:test";

import { createApplicationShutdown } from "@main/core/shutdown";

test("awaits async capability cleanup exactly once before allowing Electron to quit", async () => {
  let releaseCleanup!: () => void;
  const cleanupGate = new Promise<void>((resolve) => {
    releaseCleanup = resolve;
  });
  let cleanupCount = 0;
  let quitCount = 0;
  let startedCount = 0;
  let preventedCount = 0;
  const shutdown = createApplicationShutdown({
    dispose: async () => {
      cleanupCount += 1;
      await cleanupGate;
    },
    onStarted: () => {
      startedCount += 1;
    },
    requestQuit: () => {
      quitCount += 1;
    },
  });
  const event = { preventDefault: () => (preventedCount += 1) };

  const first = shutdown.handleBeforeQuit(event);
  const duplicate = shutdown.handleBeforeQuit(event);
  expect(first).toBe(duplicate);
  expect({ cleanupCount, preventedCount, quitCount, startedCount }).toEqual({
    cleanupCount: 0,
    preventedCount: 2,
    quitCount: 0,
    startedCount: 1,
  });

  releaseCleanup();
  await first;
  expect({ cleanupCount, quitCount }).toEqual({ cleanupCount: 1, quitCount: 1 });

  expect(shutdown.handleBeforeQuit(event)).toBeNull();
  expect(preventedCount).toBe(2);
});

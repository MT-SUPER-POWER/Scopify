import { afterEach, expect, mock, test } from "bun:test";

import {
  dispatchDesktopMainQueueCommand,
  hasDesktopMainQueueCommandDispatcher,
  registerDesktopMainQueueCommandDispatcher,
} from "@/lib/playbackHost/desktopMainQueueCommandDispatcher";

let unregister: (() => void) | null = null;

afterEach(() => {
  unregister?.();
  unregister = null;
});

test("fails closed when the Main Window queue dispatcher is unavailable", async () => {
  await expect(
    dispatchDesktopMainQueueCommand({ enabled: true, type: "set-shuffle" }),
  ).resolves.toEqual({
    reason: "desktop-main-queue-command-dispatcher-unavailable",
    status: "unavailable",
  });
  expect(hasDesktopMainQueueCommandDispatcher()).toBeFalse();
});

test("only the active registration can clear the Main Window queue dispatcher", async () => {
  const first = mock(async () => ({ status: "applied" as const }));
  const second = mock(async () => ({ status: "applied" as const }));
  const removeFirst = registerDesktopMainQueueCommandDispatcher(first);
  unregister = registerDesktopMainQueueCommandDispatcher(second);

  removeFirst();
  await expect(
    dispatchDesktopMainQueueCommand({ repeatMode: "all", type: "set-repeat-mode" }),
  ).resolves.toEqual({ status: "applied" });

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith({ repeatMode: "all", type: "set-repeat-mode" });
  expect(hasDesktopMainQueueCommandDispatcher()).toBeTrue();
});

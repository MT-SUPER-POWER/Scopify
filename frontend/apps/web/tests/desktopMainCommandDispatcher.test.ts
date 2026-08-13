import { afterEach, expect, mock, test } from "bun:test";

import {
  dispatchDesktopMainPlaybackCommand,
  hasDesktopMainPlaybackCommandDispatcher,
  registerDesktopMainPlaybackCommandDispatcher,
} from "@/lib/playbackHost/desktopMainCommandDispatcher";

let unregister: (() => void) | null = null;

afterEach(() => {
  unregister?.();
  unregister = null;
});

test("fails closed when the Main Window replica has not registered a command dispatcher", async () => {
  const receipt = await dispatchDesktopMainPlaybackCommand({
    commandId: "unbound-toggle",
    type: "toggle",
  });

  expect(receipt).toEqual({
    commandId: "unbound-toggle",
    reason: "desktop-main-playback-command-dispatcher-unavailable",
    status: "unavailable",
  });
  expect(hasDesktopMainPlaybackCommandDispatcher()).toBeFalse();
});

test("only the active registration can clear the Main Window command dispatcher", async () => {
  const first = mock(async () => ({ commandId: "first", status: "accepted" as const }));
  const second = mock(async () => ({ commandId: "second", status: "accepted" as const }));
  const removeFirst = registerDesktopMainPlaybackCommandDispatcher(first);
  unregister = registerDesktopMainPlaybackCommandDispatcher(second);

  removeFirst();
  const receipt = await dispatchDesktopMainPlaybackCommand({ commandId: "next-1", type: "next" });

  expect(receipt).toEqual({ commandId: "second", status: "accepted" });
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith({ commandId: "next-1", type: "next" });
  expect(hasDesktopMainPlaybackCommandDispatcher()).toBeTrue();
});

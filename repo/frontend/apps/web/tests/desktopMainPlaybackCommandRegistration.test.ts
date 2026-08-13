import { describe, expect, test } from "bun:test";

import { registerDesktopMainPlaybackCommands } from "@/components/player/DesktopMainPlaybackReplicaProvider";
import {
  dispatchDesktopMainPlaybackCommand,
  hasDesktopMainPlaybackCommandDispatcher,
} from "@/lib/playbackHost/desktopMainCommandDispatcher";
import type { PlaybackCommand } from "@mt-super-power/desktop-contract";

function createSource() {
  const commands: PlaybackCommand[] = [];
  return {
    commands,
    dispatch(command: PlaybackCommand) {
      commands.push(command);
      return Promise.resolve({ commandId: command.commandId, status: "accepted" as const });
    },
  };
}

describe("desktop Main playback command registration", () => {
  test("registers the active Main Replica dispatcher and strictly unregisters it", async () => {
    const source = createSource();
    const unregister = registerDesktopMainPlaybackCommands(source, {
      isDesktop: true,
      playbackHost: { getNonce: () => null, reportReady: () => false },
    });

    expect(hasDesktopMainPlaybackCommandDispatcher()).toBeTrue();
    await expect(
      dispatchDesktopMainPlaybackCommand({ commandId: "main-next", type: "next" }),
    ).resolves.toEqual({ commandId: "main-next", status: "accepted" });
    expect(source.commands).toEqual([{ commandId: "main-next", type: "next" }]);

    unregister();
    expect(hasDesktopMainPlaybackCommandDispatcher()).toBeFalse();
    await expect(
      dispatchDesktopMainPlaybackCommand({ commandId: "after-unmount", type: "next" }),
    ).resolves.toEqual({
      commandId: "after-unmount",
      reason: "desktop-main-playback-command-dispatcher-unavailable",
      status: "unavailable",
    });
  });

  test("does not register from a Browser renderer or the hidden Host", () => {
    const source = createSource();
    const unregisterBrowser = registerDesktopMainPlaybackCommands(source, {
      isDesktop: false,
      playbackHost: { getNonce: () => null, reportReady: () => false },
    });
    expect(hasDesktopMainPlaybackCommandDispatcher()).toBeFalse();
    unregisterBrowser();

    const unregisterHost = registerDesktopMainPlaybackCommands(source, {
      isDesktop: true,
      playbackHost: { getNonce: () => "host-nonce", reportReady: () => false },
    });
    expect(hasDesktopMainPlaybackCommandDispatcher()).toBeFalse();
    unregisterHost();
  });
});

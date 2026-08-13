import { describe, expect, mock, test } from "bun:test";

import { registerMediaControlCommands } from "@/components/PlayerCommandHandler";
import type { MediaControlCommand, RuntimeMediaControls } from "@/lib/runtime";
import type { PlaybackCommands } from "@/types/playbackTransport";

class TestMediaControls {
  listener: ((command: MediaControlCommand) => void) | null = null;

  emit(command: MediaControlCommand) {
    this.listener?.(command);
  }

  onCommand(callback: (command: MediaControlCommand) => void) {
    this.listener = callback;
    return () => {
      if (this.listener === callback) this.listener = null;
    };
  }
}

describe("PlayerCommandHandler media controls", () => {
  test("routes Electron media commands through playback commands and cleans up", () => {
    const media = new TestMediaControls();
    const commands = {
      next: mock(async () => ({ commandId: "next", status: "accepted" as const })),
      previous: mock(async () => ({ commandId: "previous", status: "accepted" as const })),
      toggle: mock(async () => ({ commandId: "toggle", status: "accepted" as const })),
    } satisfies Pick<PlaybackCommands, "next" | "previous" | "toggle">;

    const unsubscribe = registerMediaControlCommands(
      media satisfies Pick<RuntimeMediaControls, "onCommand">,
      commands,
    );

    media.emit("prev");
    media.emit("next");
    media.emit("toggle-play");

    expect(commands.previous).toHaveBeenCalledTimes(1);
    expect(commands.next).toHaveBeenCalledTimes(1);
    expect(commands.toggle).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(media.listener).toBeNull();
  });
});

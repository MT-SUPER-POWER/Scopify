"use client";

import { useEffect } from "react";

import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import { runtime } from "@/lib/runtime";
import type { RuntimeMediaControls } from "@/lib/runtime";
import type { PlaybackCommands } from "@/types/playbackTransport";

export function registerMediaControlCommands(
  media: Pick<RuntimeMediaControls, "onCommand">,
  commands: Pick<PlaybackCommands, "next" | "previous" | "toggle">,
) {
  return media.onCommand((command) => {
    switch (command) {
      case "prev":
        void commands.previous();
        break;
      case "next":
        void commands.next();
        break;
      case "toggle-play":
        void commands.toggle();
        break;
    }
  });
}

export function PlayerCommandHandler() {
  useInWindowShortcuts();
  const commands = usePlaybackCommands();

  useEffect(() => {
    if (!runtime.isDesktop) return;
    return registerMediaControlCommands(runtime.media, commands);
  }, [commands]);

  return null;
}

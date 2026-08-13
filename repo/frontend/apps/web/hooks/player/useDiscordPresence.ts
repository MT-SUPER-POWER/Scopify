"use client";

import { useEffect, useRef } from "react";
import { runtime } from "@/lib/runtime";
import { useTimeStore } from "@/store/module/time";
import type { DiscordPresenceSnapshotInput } from "@/types/discordPresence";

const DISCORD_SNAPSHOT_INTERVAL_MS = 1_000;

/** Keeps desktop Discord Presence in sync without exposing the Discord IPC to UI components. */
export function useDiscordPresence(snapshot: DiscordPresenceSnapshotInput) {
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  useEffect(() => {
    if (!runtime.isDesktop) return;

    const publish = () => {
      const current = snapshotRef.current;
      void runtime.discord.publish({
        ...current,
        positionMs: useTimeStore.getState().currentTime,
        sampledAtMs: Date.now(),
      });
    };

    publish();
    const interval = window.setInterval(publish, DISCORD_SNAPSHOT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);
}

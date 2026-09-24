"use client";

import { ListMusic, SkipBack, SkipForward } from "lucide-react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import type { CommandWorkspaceFmPlaybackProps } from "@/types/commandWorkspacePersonalFm";

export function CommandWorkspaceFmPlayback({
  isLoading,
  onOpenQueue,
}: CommandWorkspaceFmPlaybackProps) {
  const commands = usePlaybackCommands();
  const playback = usePlaybackProjection();
  const footerButton =
    "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-brand/70 px-2 py-2 text-xs text-zinc-200 transition-colors hover:bg-brand/10 disabled:opacity-35 disabled:cursor-not-allowed";
  return (
    <footer className="flex gap-2 border-t border-white/8 px-4 py-3">
      <button
        type="button"
        disabled={!playback.canControl || isLoading}
        onClick={() => void commands.previous()}
        className={footerButton}
      >
        <SkipBack className="text-brand size-4 shrink-0" />
        上一首
      </button>
      <button
        type="button"
        disabled={!playback.canControl || isLoading}
        onClick={() => void commands.next()}
        className={footerButton}
      >
        <SkipForward className="text-brand size-4 shrink-0" />
        下一首
      </button>
      <button type="button" onClick={onOpenQueue} className={footerButton}>
        <ListMusic className="text-brand size-4 shrink-0" />
        面板：队列
      </button>
    </footer>
  );
}

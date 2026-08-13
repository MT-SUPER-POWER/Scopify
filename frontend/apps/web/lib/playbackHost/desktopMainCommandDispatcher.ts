import type { PlaybackCommand, PlaybackCommandReceipt } from "@scopify/desktop-contract";

/**
 * Narrow hand-off from Main Window session drafts to its active playback
 * replica transport. The visible renderer has no fallback authority: a
 * missing binding is reported as unavailable rather than being handled by
 * local media, catalog, or queue code.
 */
export type DesktopMainPlaybackCommandDispatcher = (
  command: PlaybackCommand,
) => Promise<PlaybackCommandReceipt>;

let activeDispatcher: DesktopMainPlaybackCommandDispatcher | null = null;

export function registerDesktopMainPlaybackCommandDispatcher(
  dispatcher: DesktopMainPlaybackCommandDispatcher,
): () => void {
  activeDispatcher = dispatcher;

  return () => {
    if (activeDispatcher === dispatcher) activeDispatcher = null;
  };
}

export function hasDesktopMainPlaybackCommandDispatcher(): boolean {
  return activeDispatcher !== null;
}

export function dispatchDesktopMainPlaybackCommand(
  command: PlaybackCommand,
): Promise<PlaybackCommandReceipt> {
  const dispatcher = activeDispatcher;
  if (!dispatcher) {
    return Promise.resolve({
      commandId: command.commandId,
      reason: "desktop-main-playback-command-dispatcher-unavailable",
      status: "unavailable",
    });
  }
  return dispatcher(command);
}

import type { PlaybackHostQueueCommand } from "@scopify/desktop-contract/playbackHostControl";

/**
 * Intent-only queue command emitted by the visible desktop renderer. Sequence
 * and protocol fields are deliberately owned by the session-control client so
 * Main cannot forge a session revision or become a second queue owner.
 */
export type DesktopMainQueueCommand = PlaybackHostQueueCommand extends infer TCommand
  ? TCommand extends PlaybackHostQueueCommand
    ? Omit<TCommand, "commandId" | "protocolVersion">
    : never
  : never;

export type DesktopMainQueueCommandReceipt =
  { status: "applied" } | { reason: string; status: "rejected" | "unavailable" };

/**
 * The Main replica binds this hand-off only after its control channel is
 * active. A missing binding always fails closed: no caller may fall back to a
 * local queue transition while the Host is unavailable.
 */
export type DesktopMainQueueCommandDispatcher = (
  command: DesktopMainQueueCommand,
) => Promise<DesktopMainQueueCommandReceipt>;

let activeDispatcher: DesktopMainQueueCommandDispatcher | null = null;

export function registerDesktopMainQueueCommandDispatcher(
  dispatcher: DesktopMainQueueCommandDispatcher,
): () => void {
  activeDispatcher = dispatcher;

  return () => {
    if (activeDispatcher === dispatcher) activeDispatcher = null;
  };
}

export function hasDesktopMainQueueCommandDispatcher(): boolean {
  return activeDispatcher !== null;
}

export function dispatchDesktopMainQueueCommand(
  command: DesktopMainQueueCommand,
): Promise<DesktopMainQueueCommandReceipt> {
  const dispatcher = activeDispatcher;
  if (!dispatcher) {
    return Promise.resolve({
      reason: "desktop-main-queue-command-dispatcher-unavailable",
      status: "unavailable",
    });
  }
  return dispatcher(command);
}

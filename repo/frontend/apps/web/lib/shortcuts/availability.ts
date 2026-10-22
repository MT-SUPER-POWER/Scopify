import type { ShortcutAvailabilityContext, ShortcutCommandId } from "@/types/shortcuts";

/** Playlist view commands only apply on a page that can show the lattice view. */
export function isShortcutCommandAvailable(
  commandId: ShortcutCommandId,
  { latticeActive, latticeAvailable }: ShortcutAvailabilityContext,
): boolean {
  switch (commandId) {
    case "playlist-view-list":
    case "toggle-lattice-lights-off":
      return latticeActive;
    case "playlist-view-lattice":
      return latticeAvailable && !latticeActive;
    default:
      return true;
  }
}

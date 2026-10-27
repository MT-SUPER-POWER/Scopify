import { getCommandDefinition } from "@/constants/shortcuts";
import type { ShortcutAvailabilityContext, ShortcutCommandId } from "@/types/shortcuts";

/** Availability is declared with the command and shared by every consumer. */
export function isShortcutCommandAvailable(
  commandId: ShortcutCommandId,
  context: ShortcutAvailabilityContext,
): boolean {
  return getCommandDefinition(commandId)?.isAvailable?.(context) ?? true;
}

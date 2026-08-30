import type { ShortcutCommandId, ShortcutUsageCounts } from "@/types/shortcuts";

export function rankCommandWorkspaceShortcuts<T extends { id: ShortcutCommandId }>(
  commands: readonly T[],
  usageCounts: ShortcutUsageCounts,
) {
  return commands
    .map((command, index) => ({ command, index }))
    .sort((left, right) => {
      const usageDifference =
        (usageCounts[right.command.id] ?? 0) - (usageCounts[left.command.id] ?? 0);

      return usageDifference || left.index - right.index;
    })
    .map(({ command }) => command);
}

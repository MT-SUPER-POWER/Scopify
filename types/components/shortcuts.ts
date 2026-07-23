import type {
  ShortcutAssignmentResult,
  ShortcutBinding,
  ShortcutCommandDefinition,
} from "@/types/shortcuts";

export interface ShortcutBindingRowProps {
  command: ShortcutCommandDefinition;
  binding: ShortcutBinding | null;
  isCustomized: boolean;
  onAssign: (binding: ShortcutBinding) => ShortcutAssignmentResult;
  onDisable: () => void;
  onReset: () => void;
}

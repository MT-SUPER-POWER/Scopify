import type {
  ShortcutAssignmentResult,
  ShortcutBinding,
  ShortcutCommandDefinition,
} from "@/types/shortcuts";

export interface RegisteredShortcutCommand extends ShortcutCommandDefinition {
  binding: ShortcutBinding | null;
  isCustomized: boolean;
}

export type ShortcutHelpCommand = RegisteredShortcutCommand & {
  binding: ShortcutBinding;
};

export interface ShortcutBindingRowProps {
  command: ShortcutCommandDefinition;
  binding: ShortcutBinding | null;
  isCustomized: boolean;
  onAssign: (binding: ShortcutBinding) => ShortcutAssignmentResult;
  onDisable: () => void;
  onReset: () => void;
}

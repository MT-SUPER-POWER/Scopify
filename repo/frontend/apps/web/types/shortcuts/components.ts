import type { ReactNode } from "react";
import type {
  ShortcutAssignmentResult,
  ShortcutBinding,
  ShortcutCommandDefinition,
  ShortcutCommandId,
} from "@/types/shortcuts/model";

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

export interface ShortcutHintProps {
  commandId?: ShortcutCommandId;
  label?: ReactNode;
}

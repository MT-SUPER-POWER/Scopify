import { Command } from "lucide-react";
import { getCommandDefinition } from "@/constants/shortcuts";
import type { ShortcutCommandIconProps } from "@/types/shortcuts/model";

export function ShortcutCommandIcon({ className = "size-4", commandId }: ShortcutCommandIconProps) {
  const Icon = getCommandDefinition(commandId)?.icon ?? Command;
  return <Icon className={className} />;
}

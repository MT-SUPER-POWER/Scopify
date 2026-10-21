import type { LucideIcon } from "lucide-react";

export interface TraySwitchRowProps {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

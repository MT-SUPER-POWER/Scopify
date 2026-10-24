import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface QuietStateProps {
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  description?: string;
  icon: LucideIcon;
  title: string;
}

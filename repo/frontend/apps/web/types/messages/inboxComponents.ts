import type { ReactElement, ReactNode } from "react";

export interface InboxPopoverProps {
  children: ReactNode;
  trigger: ReactElement;
  title: string;
  description?: string;
  open: boolean;
  onOpenChange(open: boolean): void;
  alignOffset?: number;
}

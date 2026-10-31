import type { ReactNode } from "react";

export interface NetworkRetryStateProps {
  actionLabel?: string;
  compact?: boolean;
  isRetrying?: boolean;
  onRetry: () => void;
  subtitle: string;
  title: string;
}

export type ConnectionNoticeTone = "warning" | "danger";

export interface ConnectionNoticeActionProps {
  children: ReactNode;
  emphasis?: boolean;
  isBusy?: boolean;
  onClick: () => void;
  tone: ConnectionNoticeTone;
}

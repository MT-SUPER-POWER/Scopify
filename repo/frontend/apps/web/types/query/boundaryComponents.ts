import type { ReactNode } from "react";

export interface QueryBoundaryProps {
  children: ReactNode;
  resetKey: string;
  title?: string;
  compact?: boolean;
  renderFailure?(props: QueryFailureProps): ReactNode;
}

export interface QueryPendingProps {
  isPaused: boolean;
}

export interface QueryRenderBoundaryProps extends QueryBoundaryProps {
  onReset: () => void;
}

export interface QueryRenderBoundaryState {
  error: Error | null;
}

export interface QueryFailureProps {
  error: Error;
  onRetry: () => void;
  title?: string;
  compact?: boolean;
}

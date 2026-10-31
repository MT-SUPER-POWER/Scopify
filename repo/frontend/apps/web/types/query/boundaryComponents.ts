import type { ReactNode } from "react";

export interface QueryBoundaryProps {
  children: ReactNode;
  resetKey: string;
  title?: string;
  compact?: boolean;
  renderFailure?(props: QueryFailureProps): ReactNode;
  /** 连接失败时的等待占位，默认是通用骨架；传入区域自己的骨架可保持布局不跳动。 */
  renderWaiting?(): ReactNode;
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

export interface QueryConnectionWaitProps {
  title?: string;
  compact?: boolean;
}

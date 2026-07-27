import type { ReactNode } from "react";

export interface LibraryContentStateProps {
  children: ReactNode;
  emptyState: ReactNode;
  hasItems: boolean;
  isError: boolean;
  isLoading: boolean;
  isRetrying: boolean;
  loadingContent?: ReactNode;
  onRetry: () => void;
}

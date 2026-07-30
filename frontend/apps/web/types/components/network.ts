export interface NetworkRetryStateProps {
  actionLabel?: string;
  compact?: boolean;
  isRetrying?: boolean;
  onRetry: () => void;
  subtitle: string;
  title: string;
}

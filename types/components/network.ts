export interface NetworkRetryStateProps {
  title: string;
  subtitle: string;
  onRetry: () => void;
  actionLabel?: string;
  compact?: boolean;
}

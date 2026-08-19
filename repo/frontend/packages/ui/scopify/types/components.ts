export interface CollectionToggleButtonProps {
  isCollected: boolean;
  isLoading: boolean;
  onToggle: () => void;
  subscribeLabel: string;
  unsubscribeLabel: string;
}

export interface MediaTitleProps {
  aliases?: readonly string[];
  aliasesClassName?: string;
  className?: string;
  name: string;
}

export interface PlayingIndicatorProps {
  ariaLabel?: string;
  className?: string;
  size?: number;
}

export interface ResponsiveTitleProps {
  className?: string;
  title: string;
}

export interface RetryStateProps {
  actionLabel?: string;
  compact?: boolean;
  isRetrying?: boolean;
  onRetry: () => void;
  subtitle: string;
  title: string;
}

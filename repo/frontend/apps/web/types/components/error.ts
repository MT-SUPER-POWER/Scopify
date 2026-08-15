export interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

type AppStatusPageRetryAction =
  | {
      onRetry: () => void;
      retryLabel: string;
    }
  | {
      onRetry?: never;
      retryLabel?: never;
    };

export type AppStatusPageProps = {
  description: string;
  homeLabel: string;
  statusCode?: string;
  title: string;
} & AppStatusPageRetryAction;

export interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

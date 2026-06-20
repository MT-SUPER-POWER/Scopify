export type NetworkErrorKind = "offline" | "timeout" | "network" | "backend" | "business";

export interface ClassifiedNetworkError {
  kind: NetworkErrorKind;
  message: string;
  retryable: boolean;
}

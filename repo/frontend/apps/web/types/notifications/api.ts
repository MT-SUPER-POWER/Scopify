export interface NotificationRequest {
  path: string;
  params: Record<string, string | number>;
  signal: AbortSignal;
}

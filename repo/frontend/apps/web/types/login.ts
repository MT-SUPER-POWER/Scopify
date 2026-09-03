export type LoginMode = "password" | "sms" | "qr";

export type QrStatus = "expired" | "loading" | "scanned" | "success" | "waiting";

export interface QrLoginProps {
  onSuccess?: () => void;
}

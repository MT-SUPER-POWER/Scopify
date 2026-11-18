import { qqClient } from "@/lib/providers/qq/client";
import type {
  QqLoginChannel,
  QqLoginStatusDto,
  QqQrCheckDto,
  QqQrCreateDto,
  QqQrKeyDto,
} from "@/types/providers/qq/loginApi";

/** Starts a QR login for one scanning app and returns its key. */
export function getQqQrKey(channel: QqLoginChannel, signal?: AbortSignal) {
  return qqClient.requestData<QqQrKeyDto>({
    url: "/login/qr/key",
    params: { channel },
    noSession: true,
    signal,
    errorContext: { operation: "qq.login.qr.key", channel },
  });
}

/** The QR image (a data URL) for a key. */
export function createQqQr(key: string, signal?: AbortSignal) {
  return qqClient.requestData<QqQrCreateDto>({
    url: "/login/qr/create",
    params: { key },
    noSession: true,
    signal,
    errorContext: { operation: "qq.login.qr.create" },
  });
}

/** Scan state for a key; the backend may hold the request briefly while it waits. */
export function checkQqQr(key: string, signal?: AbortSignal) {
  return qqClient.requestData<QqQrCheckDto>({
    url: "/login/qr/check",
    params: { key },
    noSession: true,
    signal,
    errorContext: { operation: "qq.login.qr.check" },
  });
}

/** Releases a key nobody will scan any more. Unknown or expired keys still succeed. */
export function cancelQqQr(key: string) {
  return qqClient.requestData<{ code: number }>({
    url: "/login/qr/cancel",
    params: { key },
    noSession: true,
    errorContext: { operation: "qq.login.qr.cancel" },
  });
}

/** The signed-in profile for the stored session; no profile means the session is not valid. */
export function getQqLoginStatus(signal?: AbortSignal) {
  return qqClient.requestData<QqLoginStatusDto>({
    url: "/login/status",
    signal,
    errorContext: { operation: "qq.login.status" },
  });
}

/** Ends the stored session on the backend. */
export function logoutQq() {
  return qqClient.requestData<{ code: number }>({
    url: "/logout",
    errorContext: { operation: "qq.logout" },
  });
}

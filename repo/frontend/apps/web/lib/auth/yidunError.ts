import { isApiError } from "@/lib/web/apiError";

/** HTTP status and NetEase business codes describe different failures. */
export function getYidunErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error && error.message ? error.message : fallback;
  if (!isApiError(error)) return message;
  const data = error.data;
  if (typeof data !== "object" || data === null || !("code" in data)) return message;
  return typeof data.code === "number" ? `${message} (${data.code})` : message;
}

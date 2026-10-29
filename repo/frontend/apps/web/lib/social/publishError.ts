import { isApiError } from "@/lib/web/apiError";

/** Only display server-provided business messages; transport errors use the localized fallback. */
export function getSocialPublishErrorMessage(error: unknown, fallback: string): string {
  if (
    !isApiError(error) ||
    error.kind !== "business" ||
    !error.data ||
    typeof error.data !== "object"
  ) {
    return fallback;
  }

  const data = error.data as { message?: unknown; msg?: unknown };
  for (const value of [data.msg, data.message]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

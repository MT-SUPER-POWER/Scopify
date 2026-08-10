import type { RuntimeAuthentication } from "./types";

/**
 * Opens the host-owned login surface and only falls back to route navigation
 * when the current runtime has no dedicated login window.
 */
export function openLoginWindowOrFallback(
  auth: Pick<RuntimeAuthentication, "openLoginWindow">,
  fallback: () => void,
) {
  const opened = auth.openLoginWindow();
  if (!opened) fallback();
  return opened;
}

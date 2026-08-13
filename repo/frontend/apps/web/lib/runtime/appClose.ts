import type { AppCloseAction } from "@/lib/runtime/types";

export function getRememberedAppCloseAction(action: AppCloseAction): 0 | 1 | null {
  if (action === "cancel") return null;
  return action === "minimize" ? 0 : 1;
}

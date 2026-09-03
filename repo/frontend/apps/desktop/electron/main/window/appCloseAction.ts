import type { DesktopCloseAction } from "@scopify/desktop-contract";

export type AppCloseAction = "cancel" | "exit" | "minimize";

export function getRememberedAppCloseAction(
  action: AppCloseAction,
  remember: boolean,
): DesktopCloseAction | null {
  if (!remember || action === "cancel") return null;
  return action === "minimize" ? 0 : 1;
}

export function isAppCloseAction(value: unknown): value is AppCloseAction {
  return value === "cancel" || value === "exit" || value === "minimize";
}

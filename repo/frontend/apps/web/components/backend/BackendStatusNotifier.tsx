"use client";

import { useBackendStatusNotification } from "@/hooks/backend/useBackendStatusNotification";

export function BackendStatusNotifier() {
  useBackendStatusNotification();
  return null;
}

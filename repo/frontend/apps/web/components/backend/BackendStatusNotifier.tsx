"use client";

import { usePathname } from "next/navigation";

import { useBackendStatusNotification } from "@/hooks/backend/useBackendStatusNotification";
import { isDesktopAuxiliaryRoute } from "@/lib/runtime/desktopRoute";

export function BackendStatusNotifier() {
  const pathname = usePathname();

  if (isDesktopAuxiliaryRoute(pathname)) return null;
  return <MainWindowBackendStatusNotifier />;
}

function MainWindowBackendStatusNotifier() {
  useBackendStatusNotification();
  return null;
}

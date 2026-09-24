"use client";
import { useSyncExternalStore } from "react";
import { runtime } from "@/lib/runtime";
import { getBackendBaseUrl } from "@/lib/web/request";
import {
  getMusicSessionCredential,
  MUSIC_SESSION_CHANGED_EVENT,
} from "@/lib/web/musicSessionCredential";
import { useUserStore } from "@/store/module/user";

let previousIdentity = "";
let revision = 0;

// Credentials stay in this closure, never in query keys or persisted query data.
export function getDeviceSessionScope() {
  const { user, loginType } = useUserStore.getState();
  const identity = `${getBackendBaseUrl()}|${user?.userId ?? 0}|${loginType}|${getMusicSessionCredential() ?? ""}`;
  if (identity !== previousIdentity) {
    previousIdentity = identity;
    revision += 1;
  }
  return String(revision);
}

function subscribe(onChange: () => void) {
  const unsubscribe = useUserStore.subscribe(onChange);
  const unsubscribeBackend = runtime.backend.onStatusChanged(onChange);
  window.addEventListener(MUSIC_SESSION_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener("app-config-updated", onChange);
  return () => {
    unsubscribe();
    unsubscribeBackend();
    window.removeEventListener(MUSIC_SESSION_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener("app-config-updated", onChange);
  };
}

export function useDeviceSession() {
  const scope = useSyncExternalStore(subscribe, getDeviceSessionScope, () => "server");
  const userId = useUserStore((state) => state.user?.userId ?? 0);
  const loginType = useUserStore((state) => state.loginType);
  return { scope, authenticated: scope !== "server" && userId > 0 && loginType !== "uid" };
}

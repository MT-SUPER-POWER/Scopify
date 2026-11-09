"use client";

import { useSyncExternalStore } from "react";

import { getQqSessionToken, subscribeQqSession } from "@/lib/providers/qq/session";

function hasQqSession() {
  return getQqSessionToken() !== null;
}

/** Whether a QQ session is stored, following changes from every window. */
export function useHasQqSession(): boolean {
  return useSyncExternalStore(subscribeQqSession, hasQqSession, () => false);
}

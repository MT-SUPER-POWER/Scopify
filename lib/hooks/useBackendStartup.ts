"use client";

import type { BackendStartupStatus } from "@/types/backend";

const READY_STATUS: BackendStartupStatus = {
  state: "ready",
  ready: true,
  url: "",
};

export function useBackendStartup() {
  return READY_STATUS;
}

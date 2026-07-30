import type { BackendStartupStatus } from "@scopify/desktop-contract";
import { appConfig } from "../constants.js";

export function ensureBackendUrl() {
  return `http://${appConfig.backend.host}:${appConfig.backend.port}`;
}

export function getBackendStartupStatus(): BackendStartupStatus {
  return {
    state: "ready",
    ready: true,
    url: ensureBackendUrl(),
  };
}

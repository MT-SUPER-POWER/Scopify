import type { WebConfig } from "@/types/config";

export function buildBackendBaseUrl(backend: WebConfig["backend"]): string {
  const usesDefaultPort =
    (backend.protocol === "http" && backend.port === 80) ||
    (backend.protocol === "https" && backend.port === 443);
  const port = usesDefaultPort ? "" : `:${backend.port}`;

  return `${backend.protocol}://${backend.host}${port}`;
}

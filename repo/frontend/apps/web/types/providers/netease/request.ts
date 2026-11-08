import type { ApiRequestConfig } from "@/types/network/model";

/** NetEase API request options on top of the shared client options. */
export interface NeteaseRequestConfig<D = unknown> extends ApiRequestConfig<D> {
  /** Do not attach an existing music session or expire it on authentication errors. */
  noLogin?: boolean;
  /** False keeps caller-supplied parameters without platform, timestamp or IP defaults. */
  includeDefaultParams?: boolean;
  /** The operation requires an authenticated music session and should expire account state on 401. */
  requiresMusicSession?: boolean;
}

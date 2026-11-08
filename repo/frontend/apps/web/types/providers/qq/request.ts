import type { ApiRequestConfig } from "@/types/network/model";

/** QQ Music API request options on top of the shared client options. */
export interface QqRequestConfig<D = unknown> extends ApiRequestConfig<D> {
  /** Send no QQ session and never expire it on a 401, e.g. for the QR login calls. */
  noSession?: boolean;
}

import type { ScrobbleV1Request, ScrobbleV1Response } from "@/types/api/scrobble";

import request, { requestConfig } from "../web/request";

/** Uploads one completed listening session using the desktop-compatible NCBL protocol. */
export function scrobbleV1(params: ScrobbleV1Request) {
  return request.get<ScrobbleV1Response>(
    "/scrobble/v1",
    requestConfig({ params, requiresMusicSession: true }),
  );
}

import type { BannerResponse } from "@/types/api/banner";

import request from "../web/request";

/** Fetch the public desktop banners shown on the NetEase Cloud Music home screen. */
export function getBanners() {
  return request.get<BannerResponse>("/banner", { params: { type: 0 } });
}

import type { BannerResponse } from "@/types/home/bannerApi";

import request from "../web/request";

/** Fetch the public desktop banners shown on the NetEase Cloud Music home screen. */
export function getBanners() {
  return request.get<BannerResponse>("/banner", { params: { type: 0 } });
}

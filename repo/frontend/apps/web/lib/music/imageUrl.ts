const NETEASE_IMAGE_URL = /^https?:\/\/[^/]*\.music\.126\.net\//;

/**
 * Requests a NetEase thumbnail of `size` pixels. Without `param`, NetEase serves the original
 * (often 4000×4000, ~61 MB decoded) even for a 40 px row cover. Other URLs pass through.
 */
export function getSizedImageUrl(url: string | null | undefined, size: number): string {
  if (!url) return "";
  if (!NETEASE_IMAGE_URL.test(url) || /[?&]param=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}param=${size}y${size}`;
}

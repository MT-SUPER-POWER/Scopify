const NETEASE_IMAGE_URL = /^https?:\/\/[^/]*\.music\.126\.net\//;
const QQ_ARTWORK_URL =
  /^(https?:\/\/(?:y\.gtimg\.cn|y\.qq\.com)\/music\/photo_new\/T00[12])(?:R\d+x\d+)?(M000[\w.-]+)(?=[?#]|$)/i;
const QQ_PLAYLIST_COVER_URL =
  /^(https?:\/\/qpic\.y\.qq\.com\/music_cover\/[^/?#]+\/)\d+(?=[?#]|$)/i;

const QQ_ARTWORK_SIZES = [300, 800, 1200] as const;
const QQ_PLAYLIST_COVER_SIZES = [150, 300, 600] as const;

/**
 * Requests a thumbnail of `size` pixels. Use QQ's supported size buckets to avoid decoding
 * originals (up to 3000×3000) in cover grids.
 */
export function getSizedImageUrl(url: string | null | undefined, size: number): string {
  if (!url) return "";
  if (NETEASE_IMAGE_URL.test(url)) {
    if (/[?&]param=/.test(url)) return url;
    return `${url}${url.includes("?") ? "&" : "?"}param=${size}y${size}`;
  }

  if (QQ_ARTWORK_URL.test(url)) {
    const dimension = QQ_ARTWORK_SIZES.find((bucket) => bucket >= size) ?? QQ_ARTWORK_SIZES[2];
    return url.replace(QQ_ARTWORK_URL, `$1R${dimension}x${dimension}$2`);
  }

  if (QQ_PLAYLIST_COVER_URL.test(url)) {
    const dimension =
      QQ_PLAYLIST_COVER_SIZES.find((bucket) => bucket >= size) ?? QQ_PLAYLIST_COVER_SIZES[2];
    return url.replace(QQ_PLAYLIST_COVER_URL, (_, prefix: string) => `${prefix}${dimension}`);
  }

  return url;
}

/** Full-screen backgrounds can use the original QQ album or artist picture. */
export function getOriginalCoverUrl(url: string | null | undefined): string | null {
  return url ? url.replace(QQ_ARTWORK_URL, "$1$2") : null;
}

import { runtime } from "@/lib/runtime";
import { pickCoverColor } from "@/lib/image/coverPalette";

const PALETTE_SAMPLE_SIZE = 50;

/**
 * QQ Music's image hosts send no CORS headers, so a browser cannot read their pixels. The web
 * server forwards these paths (see `rewrites` in next.config.ts); the desktop app adds the
 * header itself, so it reads the original address.
 */
const QQ_IMAGE_PROXIES: readonly { host: string; prefix: string }[] = [
  { host: "y.gtimg.cn", prefix: "/__img/gtimg" },
  { host: "music-file.y.qq.com", prefix: "/__img/qqfile" },
];

function samplingUrl(imageUrl: string): string {
  if (runtime.isDesktop) return imageUrl;
  try {
    const url = new URL(imageUrl);
    const proxy = QQ_IMAGE_PROXIES.find((item) => item.host === url.hostname);
    return proxy ? `${proxy.prefix}${url.pathname}${url.search}` : imageUrl;
  } catch {
    return imageUrl;
  }
}

/** Browser-only image sampling; keep its dependency out of shared formatting utilities. */
export async function getMainColorFromImage(imageUrl: string): Promise<string> {
  if (typeof window === "undefined") return "";

  try {
    const { getPaletteSync } = await import("colorthief");
    return await new Promise<string>((resolve) => {
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.onload = () => {
        try {
          // Read a small, filtered copy so cover noise is averaged and extraction cost is bounded.
          const canvas = document.createElement("canvas");
          canvas.width = PALETTE_SAMPLE_SIZE;
          canvas.height = PALETTE_SAMPLE_SIZE;
          const context = canvas.getContext("2d");
          if (!context) {
            resolve("");
            return;
          }

          context.imageSmoothingQuality = "high";
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const palette = getPaletteSync(canvas, {
            colorCount: 8,
            quality: 1,
            colorSpace: "oklch",
            ignoreWhite: false,
          });
          resolve(pickCoverColor(palette ?? []));
        } catch (error) {
          console.error(error);
          resolve("");
        }
      };
      image.onerror = () => {
        console.error(`图片加载失败: ${imageUrl}`);
        resolve("");
      };
      image.src = samplingUrl(imageUrl);
    });
  } catch (error) {
    console.error(error);
    return "";
  }
}

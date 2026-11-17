import { pickCoverColor } from "@/lib/image/coverPalette";

const PALETTE_SAMPLE_SIZE = 50;

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
      image.src = imageUrl;
    });
  } catch (error) {
    console.error(error);
    return "";
  }
}

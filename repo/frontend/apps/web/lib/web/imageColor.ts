/** Browser-only image sampling; keep its dependency out of shared formatting utilities. */
export async function getMainColorFromImage(imageUrl: string): Promise<string> {
  if (typeof window === "undefined") return "";

  try {
    const { getColorSync } = await import("colorthief");
    return await new Promise<string>((resolve) => {
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.onload = () => {
        try { resolve(getColorSync(image)?.hex() ?? ""); }
        catch (error) { console.error(error); resolve(""); }
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

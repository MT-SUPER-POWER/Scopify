// lib/lyrics/facet/cover.ts
// Facet only ever looks at the cover through heavy blur, so a small copy is plenty.

const COVER_SIZE = 256;

/** Loads a cover for the facets to refract, or null when it cannot be read. */
export async function loadFacetCover(url: string): Promise<ImageBitmap | null> {
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    await image.decode();
    return await createImageBitmap(image, {
      resizeWidth: COVER_SIZE,
      resizeHeight: COVER_SIZE,
      resizeQuality: "medium",
    });
  } catch (error) {
    console.warn("[FacetBackground] Cover unavailable", error);
    return null;
  }
}

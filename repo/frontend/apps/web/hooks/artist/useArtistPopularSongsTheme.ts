"use client";

import { useEffect, useState } from "react";
import { getMainColorFromImage } from "@/lib/web/imageColor";
import type { ArtistCoverTheme } from "@/types/artist/model";

export function useArtistPopularSongsTheme(cover: string | null | undefined) {
  const [result, setResult] = useState<ArtistCoverTheme | null>(null);

  useEffect(() => {
    if (!cover) return;
    let disposed = false;

    void getMainColorFromImage(cover).then((color) => {
      if (!disposed && color) setResult({ cover, color });
    });

    return () => {
      disposed = true;
    };
  }, [cover]);

  return result && result.cover === cover ? result.color : null;
}

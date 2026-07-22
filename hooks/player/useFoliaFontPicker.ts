"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaLocalFontData, FoliaStageAssets } from "@/types/foliaAssets";

export function useFoliaFontPicker(
  target: "lyrics" | "subtitle",
  assets: FoliaStageAssets,
  onClose: () => void,
) {
  const [error, setError] = useState<string | null>(null);
  const [fonts, setFonts] = useState<FoliaLocalFontData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setIsLoading(true);
    const queryLocalFonts = (
      globalThis as typeof globalThis & {
        queryLocalFonts?: () => Promise<FoliaLocalFontData[]>;
      }
    ).queryLocalFonts;
    if (!queryLocalFonts) {
      setIsLoading(false);
      return;
    }
    void queryLocalFonts()
      .then((availableFonts) => {
        if (cancelled) return;
        const uniqueFamilies = new Map<string, FoliaLocalFontData>();
        availableFonts.forEach((font) => {
          if (font.family?.trim() && !uniqueFamilies.has(font.family)) {
            uniqueFamilies.set(font.family, font);
          }
        });
        setFonts(
          [...uniqueFamilies.values()].sort((left, right) =>
            left.family.localeCompare(right.family),
          ),
        );
      })
      .catch((reason) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Unable to read system fonts.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFonts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return fonts;
    return fonts.filter((font) => font.family.toLocaleLowerCase().includes(normalizedQuery));
  }, [fonts, query]);

  const applyFontFamily = useCallback(
    (family: string) => {
      const store = useLyricStageStore.getState();
      if (target === "subtitle") {
        store.patchSettings({ subtitleFontFamily: family, subtitleFontInheritsLyrics: false });
      } else {
        store.patchSettings({ fontFamily: family });
      }
      onClose();
    },
    [onClose, target],
  );

  const uploadFont = useCallback(
    async (file: File) => {
      setError(null);
      const result = await assets.uploadLyricsFont(file);
      if (!result.ok || !result.font) {
        setError(result.error ?? "Font import failed.");
        return;
      }
      applyFontFamily(result.font.family);
    },
    [applyFontFamily, assets],
  );

  return {
    applyFontFamily,
    error,
    filteredFonts,
    isLoading,
    query,
    setQuery,
    supportsSystemFonts:
      typeof (globalThis as typeof globalThis & { queryLocalFonts?: unknown }).queryLocalFonts ===
      "function",
    uploadFont,
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CappellaAvatarImage,
  CappellaEmojiImage,
  MonetBackgroundImage,
  MonetPortraitImage,
  StoredCappellaAvatarImage,
  StoredCappellaEmojiImage,
  StoredCustomLyricsFont,
  StoredMonetBackgroundImage,
  StoredMonetPortraitImage,
} from "@/components/lyrics/folia/src/types";
import {
  buildStoredFoliaImage,
  buildStoredFoliaImages,
  clearCappellaAvatarPack,
  clearCappellaEmojiPack,
  clearMonetBackgroundImage,
  clearMonetPortraitImage,
  isSupportedFoliaImageFile,
  loadFoliaStoredAssets,
  restoreFoliaFont,
  saveCappellaAvatarPack,
  saveCappellaEmojiPack,
  saveMonetBackgroundImage,
  saveMonetPortraitImage,
  uploadAndRegisterFoliaFont,
} from "@/lib/lyrics/foliaAssetStorage";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaStageAssets, FoliaStageAssetMutationResult } from "@/types/foliaAssets";

export function useFoliaStageAssets(): FoliaStageAssets {
  const [cappellaCustomAvatarImages, setCappellaCustomAvatarImages] = useState<
    CappellaAvatarImage[]
  >([]);
  const [cappellaCustomEmojiImages, setCappellaCustomEmojiImages] = useState<CappellaEmojiImage[]>(
    [],
  );
  const [monetBackgroundImage, setMonetBackgroundImage] = useState<MonetBackgroundImage | null>(
    null,
  );
  const [monetPortraitImage, setMonetPortraitImage] = useState<MonetPortraitImage | null>(null);
  const [lyricsCustomFont, setLyricsCustomFont] = useState<StoredCustomLyricsFont | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const storedAvatarPackRef = useRef<StoredCappellaAvatarImage[]>([]);
  const storedEmojiPackRef = useRef<StoredCappellaEmojiImage[]>([]);
  const avatarUrlsRef = useRef<string[]>([]);
  const emojiUrlsRef = useRef<string[]>([]);
  const backgroundUrlRef = useRef<string | null>(null);
  const portraitUrlRef = useRef<string | null>(null);

  const replaceAvatarPack = useCallback((images: StoredCappellaAvatarImage[]) => {
    revokeUrls(avatarUrlsRef.current);
    storedAvatarPackRef.current = images;
    avatarUrlsRef.current = images.map((image) => URL.createObjectURL(image.blob));
    setCappellaCustomAvatarImages(
      images.map((image, index) => ({
        id: image.id,
        name: image.name,
        url: avatarUrlsRef.current[index],
      })),
    );
  }, []);
  const replaceEmojiPack = useCallback((images: StoredCappellaEmojiImage[]) => {
    revokeUrls(emojiUrlsRef.current);
    storedEmojiPackRef.current = images;
    emojiUrlsRef.current = images.map((image) => URL.createObjectURL(image.blob));
    setCappellaCustomEmojiImages(
      images.map((image, index) => ({
        id: image.id,
        name: image.name,
        url: emojiUrlsRef.current[index],
      })),
    );
  }, []);
  const replaceBackgroundImage = useCallback((image: StoredMonetBackgroundImage | null) => {
    if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
    backgroundUrlRef.current = image ? URL.createObjectURL(image.blob) : null;
    setMonetBackgroundImage(
      image && backgroundUrlRef.current
        ? { id: image.id, name: image.name, url: backgroundUrlRef.current }
        : null,
    );
  }, []);
  const replacePortraitImage = useCallback((image: StoredMonetPortraitImage | null) => {
    if (portraitUrlRef.current) URL.revokeObjectURL(portraitUrlRef.current);
    portraitUrlRef.current = image ? URL.createObjectURL(image.blob) : null;
    setMonetPortraitImage(
      image && portraitUrlRef.current
        ? { id: image.id, name: image.name, url: portraitUrlRef.current }
        : null,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadFoliaStoredAssets()
      .then(async (assets) => {
        if (cancelled) return;
        replaceAvatarPack(assets.avatarPack);
        replaceEmojiPack(assets.emojiPack);
        replaceBackgroundImage(assets.backgroundImage);
        replacePortraitImage(assets.portraitImage);
        const font = await restoreFoliaFont(assets.uploadedFont);
        if (!cancelled) setLyricsCustomFont(font);
      })
      .catch((error) => console.warn("[folia-stage] failed to load local assets", error))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
      revokeUrls(avatarUrlsRef.current);
      revokeUrls(emojiUrlsRef.current);
      if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current);
      if (portraitUrlRef.current) URL.revokeObjectURL(portraitUrlRef.current);
    };
  }, [replaceAvatarPack, replaceBackgroundImage, replaceEmojiPack, replacePortraitImage]);

  const importCappellaCustomAvatar = async (files: File[]) => {
    const error = validateImages(files);
    if (error) return error;
    const next = [
      ...storedAvatarPackRef.current,
      ...buildStoredFoliaImages<StoredCappellaAvatarImage>(files),
    ];
    await saveCappellaAvatarPack(next);
    replaceAvatarPack(next);
    return { ok: true };
  };
  const importCappellaCustomEmojiPack = async (files: File[]) => {
    const error = validateImages(files);
    if (error) return error;
    const next = [
      ...storedEmojiPackRef.current,
      ...buildStoredFoliaImages<StoredCappellaEmojiImage>(files),
    ];
    await saveCappellaEmojiPack(next);
    replaceEmojiPack(next);
    return { ok: true };
  };

  return {
    cappellaCustomAvatarImages,
    cappellaCustomEmojiImages,
    clearCappellaCustomAvatar: async () => {
      await clearCappellaAvatarPack();
      replaceAvatarPack([]);
      const tuning = useLyricStageStore.getState().tunings.cappella;
      if (tuning?.avatarSource === "custom") {
        useLyricStageStore.getState().patchTuning("cappella", { avatarSource: "builtin" });
      }
    },
    clearCappellaCustomEmojiPack: async () => {
      await clearCappellaEmojiPack();
      replaceEmojiPack([]);
      const tuning = useLyricStageStore.getState().tunings.cappella;
      if (tuning?.emojiPackSource === "custom") {
        useLyricStageStore.getState().patchTuning("cappella", { emojiPackSource: "builtin" });
      }
    },
    clearMonetBackgroundImage: async () => {
      await clearMonetBackgroundImage();
      replaceBackgroundImage(null);
      useLyricStageStore.getState().patchMonetBackground({ backgroundSource: "cover-derived" });
    },
    clearMonetPortraitImage: async () => {
      await clearMonetPortraitImage();
      replacePortraitImage(null);
      useLyricStageStore.getState().patchTuning("monet", { portraitSource: "cover" });
    },
    importCappellaCustomAvatar,
    importCappellaCustomEmojiPack,
    isLoadingCappellaCustomAvatarPack: isLoading,
    isLoadingCappellaCustomEmojiPack: isLoading,
    isLoadingMonetBackgroundImage: isLoading,
    isLoadingMonetPortraitImage: isLoading,
    lyricsCustomFont,
    monetBackgroundImage,
    monetPortraitImage,
    uploadLyricsFont: async (file) => {
      try {
        const font = await uploadAndRegisterFoliaFont(file);
        setLyricsCustomFont(font);
        return { font, ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Font import failed." };
      }
    },
    uploadMonetBackgroundImage: async (files) => {
      const error = validateImages(files.slice(0, 1));
      if (error) return error;
      const image = buildStoredFoliaImage<StoredMonetBackgroundImage>(files[0]);
      await saveMonetBackgroundImage(image);
      replaceBackgroundImage(image);
      return { ok: true };
    },
    uploadMonetPortraitImage: async (files) => {
      const error = validateImages(files.slice(0, 1));
      if (error) return error;
      const image = buildStoredFoliaImage<StoredMonetPortraitImage>(files[0]);
      await saveMonetPortraitImage(image);
      replacePortraitImage(image);
      return { ok: true };
    },
  };
}

function validateImages(files: File[]): FoliaStageAssetMutationResult | null {
  if (files.length === 0) return { ok: false, error: "Select an image file." };
  if (!files.every(isSupportedFoliaImageFile)) {
    return { ok: false, error: "Unsupported image format." };
  }
  return null;
}

function revokeUrls(urls: string[]) {
  urls.forEach((url) => URL.revokeObjectURL(url));
}

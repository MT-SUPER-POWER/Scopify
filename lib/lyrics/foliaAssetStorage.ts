import { createStore, del, get, set } from "idb-keyval";

import type {
  StoredCappellaAvatarImage,
  StoredCappellaEmojiImage,
  StoredCustomLyricsFont,
  StoredMonetBackgroundImage,
  StoredMonetPortraitImage,
} from "@/components/lyrics/folia/src/types";
import type { FoliaStoredAssets, StoredUploadedFoliaFont } from "@/types/foliaAssets";

const assetStore = createStore("scopify-folia-stage", "assets");
const ASSET_KEYS = {
  avatar: "cappella-custom-avatar",
  background: "monet-background-image",
  emoji: "cappella-custom-emoji-pack",
  font: "lyrics-uploaded-font",
  portrait: "monet-portrait-image",
} as const;
const SUPPORTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const SUPPORTED_FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];
const MAX_FONT_SIZE_BYTES = 50 * 1024 * 1024;
const registeredFontIds = new Set<string>();

export async function loadFoliaStoredAssets(): Promise<FoliaStoredAssets> {
  const [avatarPack, backgroundImage, emojiPack, portraitImage, uploadedFont] = await Promise.all([
    get<StoredCappellaAvatarImage[]>(ASSET_KEYS.avatar, assetStore),
    get<StoredMonetBackgroundImage>(ASSET_KEYS.background, assetStore),
    get<StoredCappellaEmojiImage[]>(ASSET_KEYS.emoji, assetStore),
    get<StoredMonetPortraitImage>(ASSET_KEYS.portrait, assetStore),
    get<StoredUploadedFoliaFont>(ASSET_KEYS.font, assetStore),
  ]);

  return {
    avatarPack: filterStoredImages(avatarPack),
    backgroundImage: isStoredImage(backgroundImage) ? backgroundImage : null,
    emojiPack: filterStoredImages(emojiPack),
    portraitImage: isStoredImage(portraitImage) ? portraitImage : null,
    uploadedFont: isStoredFont(uploadedFont) ? uploadedFont : null,
  };
}

export const isSupportedFoliaImageFile = (file: File) =>
  file.type.startsWith("image/") ||
  SUPPORTED_IMAGE_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));

export function buildStoredFoliaImages<
  T extends StoredCappellaAvatarImage | StoredCappellaEmojiImage,
>(files: File[]): T[] {
  const timestamp = Date.now();
  return files.map(
    (file, index) =>
      ({
        blob: file,
        id: `${timestamp}-${index}-${file.name}`,
        mimeType: file.type || "application/octet-stream",
        name: file.name,
      }) as unknown as T,
  );
}

export function buildStoredFoliaImage<
  T extends StoredMonetBackgroundImage | StoredMonetPortraitImage,
>(file: File): T {
  return {
    blob: file,
    id: `${Date.now()}-${file.name}`,
    mimeType: file.type || "application/octet-stream",
    name: file.name,
  } as unknown as T;
}

export const saveCappellaAvatarPack = (images: StoredCappellaAvatarImage[]) =>
  set(ASSET_KEYS.avatar, images, assetStore);
export const saveCappellaEmojiPack = (images: StoredCappellaEmojiImage[]) =>
  set(ASSET_KEYS.emoji, images, assetStore);
export const saveMonetBackgroundImage = (image: StoredMonetBackgroundImage) =>
  set(ASSET_KEYS.background, image, assetStore);
export const saveMonetPortraitImage = (image: StoredMonetPortraitImage) =>
  set(ASSET_KEYS.portrait, image, assetStore);
export const clearCappellaAvatarPack = () => del(ASSET_KEYS.avatar, assetStore);
export const clearCappellaEmojiPack = () => del(ASSET_KEYS.emoji, assetStore);
export const clearMonetBackgroundImage = () => del(ASSET_KEYS.background, assetStore);
export const clearMonetPortraitImage = () => del(ASSET_KEYS.portrait, assetStore);

export function validateFoliaFontFile(file: File): string | null {
  const hasSupportedExtension = SUPPORTED_FONT_EXTENSIONS.some((extension) =>
    file.name.toLowerCase().endsWith(extension),
  );
  if (!hasSupportedExtension) return "Only woff2, woff, ttf, and otf font files are supported.";
  if (file.size > MAX_FONT_SIZE_BYTES) return "Font file must not exceed 50MB.";
  return null;
}

export async function uploadAndRegisterFoliaFont(file: File): Promise<StoredCustomLyricsFont> {
  const validationError = validateFoliaFontFile(file);
  if (validationError) throw new Error(validationError);

  const id = `${Date.now()}_${stripFontExtension(file.name)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const storedFont: StoredUploadedFoliaFont = {
    blob: file,
    createdAt: Date.now(),
    family: `FoliaUploadedLyricsFont_${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    id,
    label: stripFontExtension(file.name),
    mimeType: file.type || "application/octet-stream",
    name: file.name,
  };
  const metadata = await registerFoliaFont(storedFont);
  await set(ASSET_KEYS.font, storedFont, assetStore);
  return metadata;
}

export async function restoreFoliaFont(
  storedFont: StoredUploadedFoliaFont | null,
): Promise<StoredCustomLyricsFont | null> {
  return storedFont ? registerFoliaFont(storedFont) : null;
}

async function registerFoliaFont(
  storedFont: StoredUploadedFoliaFont,
): Promise<StoredCustomLyricsFont> {
  const metadata: StoredCustomLyricsFont = {
    family: storedFont.family,
    fontId: storedFont.id,
    label: storedFont.label,
    source: "uploaded",
  };
  if (registeredFontIds.has(storedFont.id)) return metadata;
  if (typeof FontFace === "undefined" || typeof document === "undefined") {
    throw new Error("This browser does not support loading uploaded fonts.");
  }
  const face = new FontFace(storedFont.family, await storedFont.blob.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  registeredFontIds.add(storedFont.id);
  return metadata;
}

function stripFontExtension(name: string) {
  const extension = SUPPORTED_FONT_EXTENSIONS.find((candidate) =>
    name.toLowerCase().endsWith(candidate),
  );
  const label = extension ? name.slice(0, -extension.length) : name;
  return label.trim() || "Uploaded Font";
}

function filterStoredImages<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value.filter(isStoredImage) : [];
}

function isStoredImage(value: unknown): value is {
  blob: Blob;
  id: string;
  mimeType: string;
  name: string;
} {
  if (!value || typeof value !== "object") return false;
  const image = value as Record<string, unknown>;
  return (
    image.blob instanceof Blob && typeof image.id === "string" && typeof image.name === "string"
  );
}

function isStoredFont(value: unknown): value is StoredUploadedFoliaFont {
  if (!isStoredImage(value)) return false;
  const font = value as unknown as Partial<StoredUploadedFoliaFont>;
  return typeof font.family === "string" && typeof font.label === "string";
}

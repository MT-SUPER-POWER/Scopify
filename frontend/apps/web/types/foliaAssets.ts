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

export interface StoredUploadedFoliaFont {
  blob: Blob;
  createdAt: number;
  family: string;
  id: string;
  label: string;
  mimeType: string;
  name: string;
}

export interface FoliaStageAssets {
  cappellaCustomAvatarImages: CappellaAvatarImage[];
  cappellaCustomEmojiImages: CappellaEmojiImage[];
  clearCappellaCustomAvatar: () => Promise<void>;
  clearCappellaCustomEmojiPack: () => Promise<void>;
  clearMonetBackgroundImage: () => Promise<void>;
  clearMonetPortraitImage: () => Promise<void>;
  importCappellaCustomAvatar: (files: File[]) => Promise<FoliaStageAssetMutationResult>;
  importCappellaCustomEmojiPack: (files: File[]) => Promise<FoliaStageAssetMutationResult>;
  isLoadingCappellaCustomAvatarPack: boolean;
  isLoadingCappellaCustomEmojiPack: boolean;
  isLoadingMonetBackgroundImage: boolean;
  isLoadingMonetPortraitImage: boolean;
  lyricsCustomFont: StoredCustomLyricsFont | null;
  monetBackgroundImage: MonetBackgroundImage | null;
  monetPortraitImage: MonetPortraitImage | null;
  uploadLyricsFont: (file: File) => Promise<FoliaStageAssetMutationResult>;
  uploadMonetBackgroundImage: (files: File[]) => Promise<FoliaStageAssetMutationResult>;
  uploadMonetPortraitImage: (files: File[]) => Promise<FoliaStageAssetMutationResult>;
}

export interface FoliaStageAssetMutationResult {
  error?: string;
  font?: StoredCustomLyricsFont;
  ok: boolean;
}

export interface FoliaStoredAssets {
  avatarPack: StoredCappellaAvatarImage[];
  backgroundImage: StoredMonetBackgroundImage | null;
  emojiPack: StoredCappellaEmojiImage[];
  portraitImage: StoredMonetPortraitImage | null;
  uploadedFont: StoredUploadedFoliaFont | null;
}

export interface FoliaLocalFontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

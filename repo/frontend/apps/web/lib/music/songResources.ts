import type {
  MusicSheet,
  SheetPreviewResponse,
  SongSheetListResponse,
  SongWikiResponse,
} from "@/types/api/songResources";
import type { SongWikiSection } from "@/types/songResources";

export function normalizeSongWiki(response: SongWikiResponse): SongWikiSection[] {
  if (!Array.isArray(response.data?.blocks)) throw new Error("Invalid song wiki response");
  const detail = response.data.blocks.find((block) => block.bizCode === "songDetailNewSongWiki");
  if (!detail) return [];
  if (!Array.isArray(detail.rnData?.blocks)) throw new Error("Invalid song wiki detail");
  return detail.rnData.blocks
    .filter(
      (block) =>
        block.blockCode === "wikiSubBlockSongInfoVo" ||
        block.blockCode === "wikiSubBlockBaseInfoVo",
    )
    .map((block) => ({
      id: block.blockCode || "",
      title: block.blockInfo?.blockName || "",
      description: block.blockInfo?.desc?.trim() || "",
      fields: (block.blockInfo?.wikiSubElementVos || []).flatMap((element) => {
        const value =
          element.wikiSubMetaVos
            ?.map((meta) => meta.text?.trim())
            .filter(Boolean)
            .join(" / ") || element.content?.trim();
        return element.title && value ? [{ label: element.title, value }] : [];
      }),
    }))
    .filter((section) => section.description || section.fields.length > 0);
}

export function normalizeSongSheets(response: SongSheetListResponse): MusicSheet[] {
  const items = response.data?.musicSheetSimpleInfoVOS;
  if (!Array.isArray(items) || response.data?.errorCode)
    throw new Error("Invalid sheet list response");
  if (
    items.some(
      (sheet) => !Number.isSafeInteger(sheet.id) || sheet.id <= 0 || typeof sheet.name !== "string",
    )
  ) {
    throw new Error("Invalid music sheet");
  }
  return Array.from(new Map(items.map((sheet) => [sheet.id, sheet])).values());
}

export function normalizeSheetPreview(response: SheetPreviewResponse): string[] {
  if (!Array.isArray(response.data)) throw new Error("Invalid sheet preview response");
  return response.data.map((page: unknown) => {
    const record = page && typeof page === "object" ? (page as Record<string, unknown>) : undefined;
    const url = typeof page === "string" ? page : (record?.imageUrl ?? record?.url);
    if (typeof url !== "string" || !/^https?:\/\//i.test(url))
      throw new Error("Invalid sheet preview page");
    return url;
  });
}

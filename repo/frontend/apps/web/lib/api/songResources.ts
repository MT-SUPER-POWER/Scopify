import request from "@/lib/web/request";
import type {
  SheetPreviewResponse,
  SongSheetListResponse,
  SongWikiResponse,
} from "@/types/api/songResources";

export async function getSongWiki(id: number, signal?: AbortSignal) {
  return (await request.get<SongWikiResponse>("/song/wiki/info", { params: { id }, signal })).data;
}
export async function getSongSheets(id: number, signal?: AbortSignal) {
  return (await request.get<SongSheetListResponse>("/sheet/list", { params: { id }, signal })).data;
}
export async function getSheetPreview(id: number, signal?: AbortSignal) {
  return (await request.get<SheetPreviewResponse>("/sheet/preview", { params: { id }, signal }))
    .data;
}

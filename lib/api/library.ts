import type { CreatedVoiceListsResponse, DjSublistResponse } from "@/types/api/library";
import request from "@/lib/web/request";

export function getSubscribedPodcasts(limit = 100, offset = 0) {
  return request.get<DjSublistResponse>("/dj/sublist", { params: { limit, offset } });
}

export function getCreatedVoiceLists(limit = 100) {
  return request.get<CreatedVoiceListsResponse>("/voicelist/my/created", { params: { limit } });
}

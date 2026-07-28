import request from "@/lib/web/request";
import type {
  CreatedVoiceListsResponse,
  LikedVoicesResponse,
  RecommendedPodcastsResponse,
  RecommendedVoiceListsResponse,
  SubscribedVoiceListsResponse,
  VoiceDetailResponse,
  VoiceLyricResponse,
  VoiceListDetailResponse,
} from "@/types/api/voicelist";

export function getSubscribedVoiceLists(limit = 200) {
  return request.get<SubscribedVoiceListsResponse>("/voicelist/my/subscribed", {
    params: { limit },
  });
}

export function getCreatedVoiceLists(limit = 100) {
  return request.get<CreatedVoiceListsResponse>("/voicelist/my/created", { params: { limit } });
}

export function getRecommendedPodcasts(limit = 6) {
  return request.get<RecommendedPodcastsResponse>("/djradio/my/radio/recommend", {
    params: { limit },
  });
}

export function getRecommendedVoiceLists(limit = 12) {
  return request.get<RecommendedVoiceListsResponse>("/v1/pc/voicelist/rcmd/list", {
    params: { limit },
  });
}

export function getLikedVoices(limit = 200) {
  return request.get<LikedVoicesResponse>("/content/my/liked/voice", {
    params: { limit },
  });
}

export function getVoiceDetail(id: number | string) {
  return request.get<VoiceDetailResponse>("/voice/detail", { params: { id } });
}

export function getVoiceLyric(id: number | string) {
  return request.get<VoiceLyricResponse>("/voice/lyric", { params: { id } });
}

export function getVoiceListDetail(id: number | string) {
  return request.get<VoiceListDetailResponse>("/voicelist/detail", { params: { id } });
}

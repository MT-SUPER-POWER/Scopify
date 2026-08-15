import request from "@/lib/web/request";
import type {
  RadioDetailResponse,
  RadioProgramsParams,
  RadioProgramsResponse,
  RadioProgramDetailResponse,
  RadioSublistResponse,
  RadioSubscriptionResponse,
} from "@/types/api/radio";

export function getRadioDetail(id: number | string) {
  return request.get<RadioDetailResponse>("/dj/detail", { params: { rid: id } });
}

export function getRadioPrograms({
  id,
  limit = 200,
  offset = 0,
  asc = true,
  updateOrder = true,
}: RadioProgramsParams) {
  return request.get<RadioProgramsResponse>("/dj/program/v6", {
    params: { asc, limit, offset, rid: id, updateOrder },
  });
}

export function getRadioProgramDetail(id: number | string) {
  return request.get<RadioProgramDetailResponse>("/dj/program/detail", { params: { id } });
}

export function getSubscribedRadios(limit = 200) {
  return request.get<RadioSublistResponse>("/dj/sublist", { params: { limit } });
}

export function subscribeRadio(id: number | string, subscribe: boolean) {
  return request.get<RadioSubscriptionResponse>("/dj/sub", {
    params: { rid: id, t: subscribe ? 1 : 0 },
  });
}

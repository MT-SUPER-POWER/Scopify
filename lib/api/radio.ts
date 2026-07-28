import request from "@/lib/web/request";
import type {
  RadioDetailResponse,
  RadioProgramsParams,
  RadioProgramsResponse,
  RadioSublistResponse,
} from "@/types/api/radio";

export function getRadioDetail(id: number | string) {
  return request.get<RadioDetailResponse>("/dj/detail", { params: { rid: id } });
}

export function getRadioPrograms({ id, limit = 200, offset = 0 }: RadioProgramsParams) {
  return request.get<RadioProgramsResponse>("/dj/program", {
    params: { limit, offset, rid: id },
  });
}

export function getSubscribedRadios(limit = 200) {
  return request.get<RadioSublistResponse>("/dj/sublist", { params: { limit } });
}

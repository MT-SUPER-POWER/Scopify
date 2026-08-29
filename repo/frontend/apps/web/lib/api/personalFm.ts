import request, { requestConfig } from "@/lib/web/request";
import type {
  PersonalFmModeParams,
  PersonalFmResponse,
  PersonalFmTrashResponse,
} from "@/types/api/personalFm";

export function getPersonalFm() {
  return request.get<PersonalFmResponse>(
    "/personal_fm",
    requestConfig({ requiresMusicSession: true }),
  );
}

export function getPersonalFmByMode(params: PersonalFmModeParams) {
  return request.get<PersonalFmResponse>(
    "/personal/fm/mode",
    requestConfig({ params, requiresMusicSession: true }),
  );
}

export function trashPersonalFmSong(id: number | string) {
  return request.get<PersonalFmTrashResponse>(
    "/fm_trash",
    requestConfig({ params: { id }, requiresMusicSession: true }),
  );
}

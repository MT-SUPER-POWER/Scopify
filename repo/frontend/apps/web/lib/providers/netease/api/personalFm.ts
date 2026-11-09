import request, { requestConfig } from "@/lib/providers/netease/client";
import type {
  NeteasePersonalFmDto,
  NeteasePersonalFmModeParams,
  NeteasePersonalFmTrashDto,
} from "@/types/providers/netease/recommendApi";

export function getPersonalFm() {
  return request.get<NeteasePersonalFmDto>(
    "/personal_fm",
    requestConfig({ requiresMusicSession: true }),
  );
}

export function getPersonalFmByMode(params: NeteasePersonalFmModeParams) {
  return request.get<NeteasePersonalFmDto>(
    "/personal/fm/mode",
    requestConfig({ params, requiresMusicSession: true }),
  );
}

export function trashPersonalFmSong(id: number | string) {
  return request.get<NeteasePersonalFmTrashDto>(
    "/fm_trash",
    requestConfig({
      expectedBusinessCodes: [200],
      params: { id },
      requiresMusicSession: true,
    }),
  );
}

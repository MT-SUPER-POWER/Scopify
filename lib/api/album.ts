import type {
  AlbumDetailResponse,
  AlbumSublistParams,
  AlbumSubscribeResponse,
} from "@/types/api/album";

import request, { requestData } from "@/lib/web/request";

// 获取已收藏专辑列表
export const getUserAlbumSublist = (params?: AlbumSublistParams) => {
  return request({
    method: "get",
    params: {
      cookie: localStorage.getItem("music_cookie") || "",
      limit: params?.limit ?? 25,
      offset: params?.offset ?? 0,
    },
    url: "/album/sublist",
  });
};

// 获取专辑详情
export const getAlbumDetail = (id: number | string) => {
  return request.get("/album", {
    params: {
      id,
    },
  });
};

export function getAlbumDetailData(id: number | string, signal?: AbortSignal) {
  return requestData<AlbumDetailResponse>({
    method: "get",
    params: { id },
    signal,
    url: "/album",
  });
}

export function subscribeAlbum(id: number | string, subscribe: boolean) {
  return requestData<AlbumSubscribeResponse>({
    method: "get",
    params: {
      id,
      t: subscribe ? 1 : 0,
    },
    url: "/album/sub",
  });
}

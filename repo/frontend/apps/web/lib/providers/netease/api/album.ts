import type {
  AlbumDetailResponse,
  AlbumSublistParams,
  AlbumSublistResponse,
  AlbumSubscribeResponse,
} from "@/types/providers/netease/albumApi";
import type { NeteaseNewestAlbumsDto } from "@/types/providers/netease/recommendApi";
import request, { requestConfig, requestData } from "@/lib/providers/netease/client";

// 获取已收藏专辑列表
export const getUserAlbumSublist = (params?: AlbumSublistParams) => {
  return request<AlbumSublistResponse>(
    requestConfig({
      method: "get",
      params: {
        limit: params?.limit ?? 25,
        offset: params?.offset ?? 0,
      },
      requiresMusicSession: true,
      url: "/album/sublist",
    }),
  );
};

// 获取专辑详情
export const getAlbumDetail = (id: number | string) => {
  return request.get<AlbumDetailResponse>("/album", {
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
    requiresMusicSession: true,
    url: "/album/sub",
  });
}

/**
 * 获取最新专辑
 * GET /album/newest
 */
export const getNewestAlbums = () => {
  return request<NeteaseNewestAlbumsDto>(
    requestConfig({
      method: "get",
      url: "/album/newest",
    }),
  );
};

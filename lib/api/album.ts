import request from "@/lib/web/request";


// 获取已收藏专辑列表
export const getUserAlbumSublist = (params?: { limit?: number; offset?: number }) => {
  return request({
    url: '/album/sublist',
    method: 'get',
    params: {
      limit: params?.limit || 25,
      offset: params?.offset || 0,
      cookie: localStorage.getItem("music_cookie") || ""
    }
  });
};


// 获取专辑详情
export const getAlbumDetail = (id: number | string) => {
  return request.get("/album", {
    params: {
      id,
    }
  })
}

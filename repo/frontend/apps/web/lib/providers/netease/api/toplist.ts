import type { NeteaseToplistsDto } from "@/types/providers/netease/recommendApi";
import request, { requestConfig } from "@/lib/providers/netease/client";

/**
 * 获取所有榜单内容摘要（包含 Top 3 歌曲信息）
 * GET /toplist/detail
 */
export const getToplistDetail = () => {
  return request<NeteaseToplistsDto>(
    requestConfig({
      method: "get",
      url: "/toplist/detail",
    }),
  );
};

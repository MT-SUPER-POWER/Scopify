import type { ToplistDetailResponse } from "@/types/api/toplist";
import request, { requestConfig } from "@/lib/web/request";

/**
 * 获取所有榜单内容摘要（包含 Top 3 歌曲信息）
 * GET /toplist/detail
 */
export const getToplistDetail = () => {
  return request<ToplistDetailResponse>(
    requestConfig({
      method: "get",
      url: "/toplist/detail",
    }),
  );
};

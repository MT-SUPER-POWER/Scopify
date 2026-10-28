import request, { requestConfig } from "@/lib/web/request";
import type {
  MvDetailInfoResponse,
  MvDetailResponse,
  MvFirstParams,
  MvListParams,
  MvListResponse,
  MvOperationResponse,
  MvPaginationParams,
  MvTopParams,
  MvTopResponse,
  MvUrlResponse,
  RecommendedMvsResponse,
  SimilarMvsResponse,
  SubscribedMvsResponse,
} from "@/types/mv/api";

/** 全部 MV，可按地区、类型和排序筛选。 */
export function getAllMVs(params: MvListParams = {}, signal?: AbortSignal) {
  return request.get<MvListResponse>("/mv/all", { params, signal });
}

/** 最新 MV；此接口不支持 offset。 */
export function getLatestMVs(params: MvFirstParams = {}, signal?: AbortSignal) {
  return request.get<MvListResponse>("/mv/first", { params, signal });
}

/** 网易出品 MV。 */
export function getExclusiveMVs(params: MvPaginationParams = {}, signal?: AbortSignal) {
  return request.get<MvListResponse>("/mv/exclusive/rcmd", { params, signal });
}

/** 推荐 MV，列表位于响应的 result 字段。 */
export function getRecommendedMVs(signal?: AbortSignal) {
  return request.get<RecommendedMvsResponse>("/personalized/mv", { signal });
}

/** MV 排行榜。 */
export function getTopMVs(params: MvTopParams = {}, signal?: AbortSignal) {
  return request.get<MvTopResponse>("/top/mv", { params, signal });
}

/** 相似 MV，列表位于响应的 mvs 字段。 */
export function getSimilarMVs(mvid: number | string, signal?: AbortSignal) {
  return request.get<SimilarMvsResponse>("/simi/mv", { params: { mvid }, signal });
}

/** MV 详情及可用分辨率；播放地址应另调 getMVUrl。 */
export function getMVDetail(mvid: number | string, signal?: AbortSignal) {
  return request.get<MvDetailResponse>("/mv/detail", { params: { mvid }, signal });
}

/** MV 点赞状态和点赞、转发、评论数。 */
export function getMVDetailInfo(mvid: number | string, signal?: AbortSignal) {
  return request.get<MvDetailInfoResponse>("/mv/detail/info", { params: { mvid }, signal });
}

/** MV 播放地址，r 对应详情 brs 中的 br，默认 1080。 */
export function getMVUrl(id: number | string, r = 1080, signal?: AbortSignal) {
  return request.get<MvUrlResponse>("/mv/url", { params: { id, r }, signal });
}

/** 收藏列表包含 MV 和视频，保留后端原始结构。 */
export function getSubscribedMVs(params: MvPaginationParams = {}, signal?: AbortSignal) {
  return request.get<SubscribedMvsResponse>(
    "/mv/sublist",
    requestConfig({ params, signal, requiresMusicSession: true }),
  );
}

/** 收藏或取消收藏 MV。 */
export function subscribeMV(mvid: number | string, subscribe: boolean) {
  return request.get<MvOperationResponse>(
    "/mv/sub",
    requestConfig({
      params: { mvid, t: subscribe ? 1 : 0 },
      requiresMusicSession: true,
      expectedBusinessCodes: [200],
    }),
  );
}

/** 点赞或取消点赞 MV，资源类型固定为 1。 */
export function toggleLikeMV(id: number | string, liked: boolean) {
  return request.get<MvOperationResponse>(
    "/resource/like",
    requestConfig({
      params: { id, type: 1, t: liked ? 1 : 0 },
      requiresMusicSession: true,
      expectedBusinessCodes: [200],
    }),
  );
}

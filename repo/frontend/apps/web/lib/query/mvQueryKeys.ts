import type { MusicCommentParams } from "@/types/api/comment";
import type { MvFirstParams, MvListParams, MvPaginationParams, MvTopParams } from "@/types/mv/api";

export const mvQueryKeys = {
  all: ["mv"] as const,
  list: (params: MvListParams = {}) =>
    [
      "mv",
      "list",
      params.area ?? "全部",
      params.type ?? "全部",
      params.order ?? "上升最快",
      params.limit ?? 30,
      params.offset ?? 0,
    ] as const,
  latest: (params: MvFirstParams = {}) =>
    ["mv", "latest", params.area ?? "全部", params.limit ?? 30] as const,
  exclusive: (params: MvPaginationParams = {}) =>
    ["mv", "exclusive", params.limit ?? 30, params.offset ?? 0] as const,
  recommended: (accountId: string) => ["mv", "recommended", accountId] as const,
  top: (params: MvTopParams = {}) =>
    ["mv", "top", params.area ?? "", params.limit ?? 30, params.offset ?? 0] as const,
  similar: (mvid: number | string) => ["mv", "similar", String(mvid)] as const,
  artist: (artistId: number | string, params: MvPaginationParams = {}) =>
    ["mv", "artist", String(artistId), params.limit ?? 30, params.offset ?? 0] as const,
  detail: (mvid: number | string, accountId: string) =>
    ["mv", "detail", String(mvid), accountId] as const,
  info: (mvid: number | string, accountId: string) =>
    ["mv", "info", String(mvid), accountId] as const,
  url: (mvid: number | string, r: number, accountId: string) =>
    ["mv", "url", String(mvid), r, accountId] as const,
  subscriptions: (accountId: string) => ["mv", "subscriptions", accountId] as const,
  subscribed: (accountId: string, params: MvPaginationParams = {}) =>
    ["mv", "subscriptions", accountId, params.limit ?? 25, params.offset ?? 0] as const,
  comments: (
    mvid: number | string,
    accountId: string,
    params: Omit<MusicCommentParams, "id"> = {},
  ) =>
    [
      "mv",
      "comments",
      String(mvid),
      accountId,
      params.limit ?? 20,
      params.offset ?? 0,
      params.before ?? 0,
    ] as const,
  subscribeMutation: (accountId: string) => ["mv", "subscribe", accountId] as const,
  likeMutation: (accountId: string) => ["mv", "like", accountId] as const,
};

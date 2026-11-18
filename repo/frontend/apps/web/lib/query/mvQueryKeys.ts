import type { MusicProvider } from "@scopify/music-domain/identity";
import { providerQueryKey } from "@/lib/query/providerQueryKey";
import type { MusicCommentParams } from "@/types/providers/netease/commentApi";
import type {
  MvFirstParams,
  MvListParams,
  MvPaginationParams,
  MvTopParams,
} from "@/types/providers/netease/mvApi";

export const mvQueryKeys = {
  all: ["mv"] as const,
  /** One MV as the platform's interface reports it. */
  detailOf: (provider: MusicProvider, mvId: string) =>
    providerQueryKey(provider, "mv", "detail", mvId),
  /** A playable stream; signed and account-dependent (VIP), so never shared across accounts. */
  stream: (provider: MusicProvider, mvId: string, maxHeight: number, accountId: string) =>
    providerQueryKey(provider, "mv", "stream", mvId, maxHeight, accountId),
  related: (provider: MusicProvider, mvId: string, limit: number) =>
    providerQueryKey(provider, "mv", "related", mvId, limit),
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

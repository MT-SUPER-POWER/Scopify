import type { QueryClient } from "@tanstack/react-query";
import { getQueryFailureKind, isConnectivityFailure } from "@/lib/query/errorPolicy";

export function refetchFailedActiveQueries(queryClient: QueryClient) {
  return queryClient.refetchQueries({
    predicate: (query) =>
      query.state.status === "error" && getQueryFailureKind(query.state.error) === "network",
    type: "active",
  });
}

/** 用最近一次连接失败的请求做探测，不额外依赖健康检查接口。 */
export async function probeConnectivity(queryClient: QueryClient) {
  const [latest] = queryClient
    .getQueryCache()
    .findAll({
      predicate: (query) =>
        query.state.status === "error" && isConnectivityFailure(query.state.error),
    })
    .sort((a, b) => b.state.errorUpdatedAt - a.state.errorUpdatedAt);
  if (!latest) return true;
  try {
    await queryClient.fetchQuery({
      ...latest.options,
      queryKey: latest.queryKey,
      retry: false,
      staleTime: 0,
    });
    return true;
  } catch (error) {
    return !isConnectivityFailure(error);
  }
}

import type { QueryFallbackSource } from "@/types/queryBoundary";

export function toFallbackSource<T>(
  query: Omit<QueryFallbackSource<unknown>, "data">,
  data: T | undefined,
): QueryFallbackSource<T> {
  return {
    data,
    error: query.error,
    isPending: query.isPending,
    isFetching: query.isFetching,
    fetchStatus: query.fetchStatus,
  };
}

/** 只用于同一业务单元的明确备用来源，不聚合独立栏目的失败。 */
export function selectFallbackSource<T>(
  sources: QueryFallbackSource<T>[],
  hasItems: (data: T) => boolean,
) {
  const source =
    sources.find(({ data }) => data !== undefined && hasItems(data)) ??
    sources.find(({ data }) => data !== undefined);
  if (source) return { data: source.data, isPending: false, isPaused: false };
  if (sources.length && sources.every(({ error, isFetching }) => error && !isFetching)) {
    throw sources[0].error;
  }
  return {
    data: undefined,
    isPending: sources.some(({ isPending, isFetching }) => isPending || isFetching),
    isPaused: sources.some(({ fetchStatus }) => fetchStatus === "paused"),
  };
}

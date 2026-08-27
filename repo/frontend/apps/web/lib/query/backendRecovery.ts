import type { QueryClient } from "@tanstack/react-query";

export function refetchFailedActiveQueries(queryClient: QueryClient) {
  return queryClient.refetchQueries({
    predicate: (query) => query.state.status === "error",
    type: "active",
  });
}

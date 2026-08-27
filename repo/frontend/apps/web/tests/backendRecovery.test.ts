import { expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

import { refetchFailedActiveQueries } from "@/lib/query/backendRecovery";

test("refetches an active sidebar query after the managed backend becomes available", async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const queryKey = ["library", "playlists", 42] as const;
  let backendAvailable = false;
  let requestCount = 0;
  const queryFn = async () => {
    requestCount += 1;
    if (!backendAvailable) throw new Error("Network Error");
    return ["playlist"];
  };

  await expect(queryClient.fetchQuery({ queryFn, queryKey })).rejects.toThrow("Network Error");
  const observer = new QueryObserver(queryClient, {
    queryFn,
    queryKey,
    retry: false,
    retryOnMount: false,
  });
  const unsubscribe = observer.subscribe(() => undefined);

  backendAvailable = true;
  await refetchFailedActiveQueries(queryClient);

  expect(observer.getCurrentResult().status).toBe("success");
  expect(observer.getCurrentResult().data).toEqual(["playlist"]);
  expect(requestCount).toBe(2);
  unsubscribe();
  queryClient.clear();
});

import { describe, expect, it } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { getQueryFailureKind, throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { ApiError } from "@/lib/web/apiError";

describe("query boundary policy", () => {
  it("throws initial failures but keeps valid empty and cached data", () => {
    expect(throwQueryErrorWithoutData(new Error(), { state: { data: undefined } })).toBe(true);
    for (const data of [[], null, 0, false, { name: "cached" }]) {
      expect(throwQueryErrorWithoutData(new Error(), { state: { data } })).toBe(false);
    }
  });

  it("does not classify business, session or programming errors as network failures", () => {
    for (const kind of ["network", "timeout", "backend", "offline"] as const) {
      expect(getQueryFailureKind(new ApiError({ kind, message: kind }))).toBe("network");
    }
    expect(getQueryFailureKind(new ApiError({ kind: "business", message: "not found" }))).toBe(
      "business",
    );
    expect(getQueryFailureKind(new ApiError({ kind: "unauthenticated", message: "login" }))).toBe(
      "unauthenticated",
    );
    expect(getQueryFailureKind(new TypeError("broken render"))).toBe("unexpected");
  });

  it("preserves cached data on refresh failure and recovers on the next request", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryKey = ["boundary-test"];
    client.setQueryData(queryKey, ["cached"]);
    await client
      .fetchQuery({ queryKey, staleTime: 0, queryFn: () => Promise.reject(new Error("offline")) })
      .catch(() => undefined);
    const state = client.getQueryState(queryKey);
    if (!state) throw new Error("The failed query must remain in the cache.");
    expect(state.status).toBe("error");
    expect(state.data).toEqual(["cached"]);
    expect(throwQueryErrorWithoutData(state.error, { state })).toBe(false);
    await client.fetchQuery({ queryKey, queryFn: async () => ["fresh"] });
    expect(client.getQueryState(queryKey)?.status).toBe("success");
    client.clear();
  });
});

export interface QueryErrorPolicyState {
  state: { data: unknown };
}

export type QueryFailureKind = "network" | "business" | "unauthenticated" | "unexpected";

export interface QueryFallbackSource<T> {
  data: T | undefined;
  error: Error | null;
  isPending: boolean;
  isFetching: boolean;
  fetchStatus: "fetching" | "paused" | "idle";
}

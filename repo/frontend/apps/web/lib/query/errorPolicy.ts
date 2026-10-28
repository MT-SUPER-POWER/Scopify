import { isApiError } from "@/lib/web/apiError";
import type { QueryErrorPolicyState, QueryFailureKind } from "@/types/query/boundary";

export function throwQueryErrorWithoutData(_error: unknown, query: QueryErrorPolicyState) {
  return query.state.data === undefined;
}

export function getQueryFailureKind(error: unknown): QueryFailureKind {
  if (!isApiError(error)) return "unexpected";
  if (error.kind === "business" || error.kind === "unauthenticated") return error.kind;
  return "network";
}

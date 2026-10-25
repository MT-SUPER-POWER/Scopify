export type MvQueryId = number | string | null | undefined;

export interface MvQueryOptions {
  enabled?: boolean;
}

export interface MvSubscriptionVariables {
  mvid: number | string;
  subscribe: boolean;
}

export interface MvLikeVariables {
  mvid: number | string;
  liked: boolean;
}

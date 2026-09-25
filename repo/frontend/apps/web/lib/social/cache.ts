import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type {
  SocialEvent,
  SocialEventPage,
  SocialEventPatch,
  SocialPeoplePage,
  SocialProfile,
  SocialUser,
} from "@/types/social";

export const socialKey = (account: string, kind: string, ...parts: (string | undefined)[]) =>
  ["social", account, kind, ...parts] as const;

function updateEvent(event: SocialEvent, update: SocialEventPatch): SocialEvent {
  const next = event.id === update.id ? { ...event, ...update.patch } : event;
  return next.forward
    ? {
        ...next,
        forward:
          next.forward.id === update.id && update.deleted
            ? undefined
            : updateEvent(next.forward, update),
        unavailableForward:
          next.forward.id === update.id && update.deleted ? true : next.unavailableForward,
      }
    : next;
}
export function patchEvent(client: QueryClient, account: string, update: SocialEventPatch) {
  client.setQueriesData<InfiniteData<SocialEventPage<unknown>>>(
    { queryKey: socialKey(account, "events") },
    (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items
                .filter((item) => !(update.deleted && item.id === update.id))
                .map((item) => updateEvent(item, update)),
            })),
          }
        : data,
  );
  client.setQueriesData<SocialEvent | null>({ queryKey: socialKey(account, "event") }, (data) =>
    data ? (update.deleted && data.id === update.id ? null : updateEvent(data, update)) : data,
  );
}
export function patchFollow(client: QueryClient, account: string, uid: string, followed: boolean) {
  const update = (user: SocialUser) =>
    user.id === uid ? { ...user, followed, mutual: followed ? user.mutual : false } : user;
  const event = (value: SocialEvent): SocialEvent => ({
    ...value,
    user: update(value.user),
    forward: value.forward ? event(value.forward) : undefined,
  });
  client.setQueriesData<InfiniteData<SocialEventPage<unknown>>>(
    { queryKey: socialKey(account, "events") },
    (data) =>
      data
        ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(event) })) }
        : data,
  );
  client.setQueriesData<SocialEvent | null>({ queryKey: socialKey(account, "event") }, (data) =>
    data ? event(data) : data,
  );
  client.setQueriesData<InfiniteData<SocialPeoplePage>>(
    { queryKey: socialKey(account, "people") },
    (data) =>
      data
        ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(update) })) }
        : data,
  );
  client.setQueryData<SocialProfile>(socialKey(account, "profile", uid), (data) =>
    data
      ? {
          ...data,
          ...update(data),
          followers: Math.max(
            0,
            data.followers + (data.followed === followed ? 0 : followed ? 1 : -1),
          ),
        }
      : data,
  );
}
export function findEvent(
  client: QueryClient,
  account: string,
  id: string,
): SocialEvent | undefined {
  const search = (items: SocialEvent[]): SocialEvent | undefined => {
    for (const event of items) {
      if (event.id === id) return event;
      if (event.forward) {
        const found = search([event.forward]);
        if (found) return found;
      }
    }
  };
  for (const [, data] of client.getQueriesData<InfiniteData<SocialEventPage<unknown>>>({
    queryKey: socialKey(account, "events"),
  })) {
    const found = search(data?.pages.flatMap((page) => page.items) ?? []);
    if (found) return found;
  }
}

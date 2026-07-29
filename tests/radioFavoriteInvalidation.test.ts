import { QueryClient } from "@tanstack/react-query";
import { expect, test } from "bun:test";

import { invalidateRadioFavoriteCaches } from "@/hooks/radio/useRadioFavorite";
import { musicQueryKeys } from "@/lib/query/queryKeys";

test("invalidates the podcast library after a radio favorite changes", async () => {
  const userId = 42;
  const queryClient = new QueryClient();
  const radioSubscriptionsKey = musicQueryKeys.radio.subscriptions(userId);
  const subscribedPodcastsKey = musicQueryKeys.library.subscribedPodcasts(userId);

  queryClient.setQueryData(radioSubscriptionsKey, ["1231333508"]);
  queryClient.setQueryData(subscribedPodcastsKey, [{ id: 1231333508, name: "Podcast" }]);

  await invalidateRadioFavoriteCaches(queryClient, userId);

  expect(queryClient.getQueryState(radioSubscriptionsKey)?.isInvalidated).toBeTrue();
  expect(queryClient.getQueryState(subscribedPodcastsKey)?.isInvalidated).toBeTrue();
});

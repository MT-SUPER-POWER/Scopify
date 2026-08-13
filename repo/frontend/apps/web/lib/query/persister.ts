import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

import { deletePageCache, getPageCache, pageTtlMs, setPageCache } from "@/lib/cache/pageCache";

const QUERY_CACHE_KEY = "tanstack-query";

export const queryPersister: Persister = {
  async persistClient(client: PersistedClient) {
    await setPageCache(QUERY_CACHE_KEY, client, pageTtlMs());
  },
  async removeClient() {
    await deletePageCache(QUERY_CACHE_KEY);
  },
  async restoreClient() {
    return (await getPageCache<PersistedClient>(QUERY_CACHE_KEY)) ?? undefined;
  },
};

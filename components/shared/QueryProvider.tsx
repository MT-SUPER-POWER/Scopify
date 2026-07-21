"use client";

import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { pageTtlMs } from "@/lib/cache/pageCache";
import { queryPersister } from "@/lib/query/persister";
import { MUSIC_SESSION_EXPIRED_EVENT } from "@/lib/query/session";
import { usePlayerStore, useUserStore } from "@/store";

const QUERY_CACHE_BUSTER = "scopify-query-v1";
const QUERY_STALE_TIME_MS = 5 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const handleExpiredSession = () => {
      useUserStore.getState().clearSession();
      usePlayerStore.getState().cleanCache();
      queryClient.removeQueries({
        predicate: (query) => query.meta?.scope === "account",
      });
      router.replace("/login");
    };

    window.addEventListener(MUSIC_SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(MUSIC_SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, [queryClient, router]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.meta?.persist === true && defaultShouldDehydrateQuery(query),
        },
        maxAge: pageTtlMs(),
        persister: queryPersister,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: pageTtlMs(),
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  });
}

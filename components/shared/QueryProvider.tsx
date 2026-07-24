"use client";

import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { pageTtlMs } from "@/lib/cache/pageCache";
import { useRendererErrorReporting } from "@/lib/hooks/useRendererErrorReporting";
import { queryPersister } from "@/lib/query/persister";
import { MUSIC_SESSION_EXPIRED_EVENT } from "@/lib/query/session";
import { reportFailure } from "@/lib/web/errorTracking";
import { usePlayerStore, useUserStore } from "@/store";

const QUERY_CACHE_BUSTER = "scopify-query-v1";
const QUERY_STALE_TIME_MS = 5 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(createQueryClient);
  useRendererErrorReporting();

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
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        reportFailure({
          context: {
            mutationKey: mutation.options.mutationKey,
            mutationMeta: mutation.options.meta,
          },
          error,
          event: "query.mutation_failed",
          message: "TanStack Query mutation failed",
          source: "query",
        });
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        reportFailure({
          context: {
            queryKey: query.queryKey,
            queryMeta: query.meta,
          },
          error,
          event: "query.request_failed",
          message: "TanStack Query request failed",
          source: "query",
        });
      },
    }),
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        gcTime: pageTtlMs(),
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  });
}

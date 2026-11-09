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
import { QueryDevtools } from "@/components/shared/QueryDevtools";
import { useRendererErrorReporting } from "@/hooks/core/useRendererErrorReporting";
import { useProviderSwitchRequests } from "@/hooks/provider/useProviderSwitchRequests";
import { queryPersister } from "@/lib/query/persister";
import { openLoginForPlatform } from "@/lib/auth/loginPlatform";
import { clearQqSessionToken } from "@/lib/providers/qq/session";
import { MUSIC_SESSION_EXPIRED_EVENT, QQ_SESSION_EXPIRED_EVENT } from "@/lib/query/session";
import { runtime } from "@/lib/runtime";
import { openLoginWindowOrFallback } from "@/lib/runtime/login";
import { reportFailure } from "@/lib/web/errorTracking";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import { syncUserSessionFromCookie } from "@/lib/web/sessionHydration";
import { getNeteaseBaseUrl } from "@/lib/providers/netease/client";
import { usePlayerStore, useUserStore } from "@/store";
import { useActiveProviderStore } from "@/store/module/provider";

const QUERY_CACHE_BUSTER = "scopify-query-v1";
const QUERY_STALE_TIME_MS = 5 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(createQueryClient);
  useRendererErrorReporting();
  const handleCacheRestored = useProviderSwitchRequests(queryClient);

  useEffect(() => {
    const credential = getMusicSessionCredential();
    if (credential) {
      if (runtime.isDesktop) {
        void runtime.auth
          .importMusicSession(credential, getNeteaseBaseUrl())
          .catch(() => undefined);
      }
      void syncUserSessionFromCookie();
    }
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      useUserStore.getState().clearSession();
      // The QQ account keeps its own session, queue and data.
      queryClient.removeQueries({
        predicate: (query) => query.meta?.scope === "account" && query.queryKey[0] !== "qq",
      });
      if (useActiveProviderStore.getState().activeProvider !== "netease") return;
      usePlayerStore.getState().cleanCache();
      openLoginWindowOrFallback(runtime.auth, () => router.replace("/login"));
    };

    window.addEventListener(MUSIC_SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(MUSIC_SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, [queryClient, router]);

  useEffect(() => {
    // Only the QQ account is signed out; NetEase's session and data stay untouched.
    const handleExpiredQqSession = () => {
      clearQqSessionToken();
      queryClient.removeQueries({
        queryKey: ["qq"],
        predicate: (query) => query.meta?.scope === "account",
      });
      // Like NetEase: QQ stays the active platform and its login opens.
      if (useActiveProviderStore.getState().activeProvider !== "qq") return;
      openLoginForPlatform("qq", (url) => router.replace(url));
    };

    window.addEventListener(QQ_SESSION_EXPIRED_EVENT, handleExpiredQqSession);
    return () => window.removeEventListener(QQ_SESSION_EXPIRED_EVENT, handleExpiredQqSession);
  }, [queryClient, router]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      onSuccess={handleCacheRestored}
      onError={handleCacheRestored}
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
      <QueryDevtools />
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

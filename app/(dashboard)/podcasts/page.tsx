"use client";

import { useState } from "react";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";
import { LikedVoiceList } from "@/components/library/LikedVoiceList";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { PodcastRecommendations } from "@/components/library/PodcastRecommendations";
import { PodcastViewToggle } from "@/components/library/PodcastViewToggle";
import { SubscribedPodcastGrid } from "@/components/library/SubscribedPodcastGrid";
import { SubscribedPodcastTable } from "@/components/library/SubscribedPodcastTable";
import { TimeBasedBackground } from "@/components/shared/TimeBasedBackground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreatedPodcastsQuery,
  useLikedVoicesQuery,
  useRecommendedPodcastsQuery,
  useSubscribedPodcastsQuery,
} from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { PodcastLibraryTab, PodcastViewMode } from "@/types/library";

function isPodcastLibraryTab(value: string): value is PodcastLibraryTab {
  return value === "subscribed" || value === "created" || value === "liked";
}

export default function PodcastsPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const router = useSmartRouter();
  const [activeTab, setActiveTab] = useState<PodcastLibraryTab>("subscribed");
  const [subscribedView, setSubscribedView] = useState<PodcastViewMode>("list");
  const subscribedPodcastsQuery = useSubscribedPodcastsQuery();
  const createdPodcastsQuery = useCreatedPodcastsQuery();
  const likedVoicesQuery = useLikedVoicesQuery();
  const recommendedPodcastsQuery = useRecommendedPodcastsQuery();
  const unavailableState = (
    <LibraryEmptyState
      title={t("library.empty.podcasts.title")}
      description={t("library.empty.podcasts.description")}
    />
  );

  const handleTabChange = (value: string) => {
    if (isPodcastLibraryTab(value)) setActiveTab(value);
  };

  return (
    <main className="relative min-h-screen bg-[#121212] px-6 pt-24 pb-28 md:px-10">
      <TimeBasedBackground />
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <header className="flex flex-wrap items-center justify-between gap-4 pb-5">
            <h1 className="text-3xl font-bold text-white">{t("library.title.podcasts")}</h1>
            {isLoggedIn && activeTab === "subscribed" ? (
              <PodcastViewToggle value={subscribedView} onChange={setSubscribedView} />
            ) : null}
          </header>
          {isLoggedIn ? (
            <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
              <TabsTrigger
                value="subscribed"
                className="shrink-0 rounded-full border border-white/10 bg-white/5"
              >
                {t("library.podcasts.subscribed")}
              </TabsTrigger>
              <TabsTrigger
                value="created"
                className="shrink-0 rounded-full border border-white/10 bg-white/5"
              >
                {t("library.podcasts.created")}
              </TabsTrigger>
              <TabsTrigger
                value="liked"
                className="shrink-0 rounded-full border border-white/10 bg-white/5"
              >
                {t("library.podcasts.likedVoices")}
              </TabsTrigger>
            </TabsList>
          ) : null}

          {!isLoggedIn ? (
            <LoginRequiredPrompt
              reason="library"
              onLogin={() => router.push("/login?reason=library")}
            />
          ) : (
            <>
              <TabsContent value="subscribed" className="mt-8">
                <LibraryContentState
                  hasItems={(subscribedPodcastsQuery.data?.length ?? 0) > 0}
                  isError={subscribedPodcastsQuery.isError}
                  isLoading={subscribedPodcastsQuery.isLoading}
                  isRetrying={subscribedPodcastsQuery.isRefetching}
                  emptyState={unavailableState}
                  onRetry={() => void subscribedPodcastsQuery.refetch()}
                >
                  {subscribedView === "list" ? (
                    <SubscribedPodcastTable podcasts={subscribedPodcastsQuery.data ?? []} />
                  ) : (
                    <SubscribedPodcastGrid podcasts={subscribedPodcastsQuery.data ?? []} />
                  )}
                </LibraryContentState>
                <PodcastRecommendations
                  podcasts={recommendedPodcastsQuery.data ?? []}
                  isLoading={recommendedPodcastsQuery.isLoading}
                  isError={recommendedPodcastsQuery.isError}
                  isRefreshing={recommendedPodcastsQuery.isRefetching}
                  onRefresh={() => void recommendedPodcastsQuery.refetch()}
                />
              </TabsContent>

              <TabsContent value="created" className="mt-8">
                <LibraryContentState
                  hasItems={(createdPodcastsQuery.data?.length ?? 0) > 0}
                  isError={createdPodcastsQuery.isError}
                  isLoading={createdPodcastsQuery.isLoading}
                  isRetrying={createdPodcastsQuery.isRefetching}
                  emptyState={unavailableState}
                  onRetry={() => void createdPodcastsQuery.refetch()}
                >
                  <LibraryMediaGrid items={createdPodcastsQuery.data ?? []} />
                </LibraryContentState>
              </TabsContent>

              <TabsContent value="liked" className="mt-8">
                <LibraryContentState
                  hasItems={(likedVoicesQuery.data?.length ?? 0) > 0}
                  isError={likedVoicesQuery.isError}
                  isLoading={likedVoicesQuery.isLoading}
                  isRetrying={likedVoicesQuery.isRefetching}
                  emptyState={unavailableState}
                  onRetry={() => void likedVoicesQuery.refetch()}
                >
                  <LikedVoiceList voices={likedVoicesQuery.data ?? []} />
                </LibraryContentState>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </main>
  );
}

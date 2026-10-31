"use client";

import { Podcast } from "lucide-react";
import { useState } from "react";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { PodcastViewToggle } from "@/components/library/PodcastViewToggle";
import { QuietState } from "@/components/shared/QuietState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreatedPodcastsQuery,
  useLikedVoicesQuery,
  useRecommendedPodcastsQuery,
  useSubscribedPodcastsQuery,
} from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useI18n } from "@/store/module/i18n";
import type { PodcastLibraryTab, PodcastViewMode } from "@/types/library/model";
import { LikedVoiceList } from "./_components/LikedVoiceList";
import { PodcastRecommendations } from "./_components/PodcastRecommendations";
import { SubscribedPodcastGrid } from "./_components/SubscribedPodcastGrid";
import { SubscribedPodcastTable } from "./_components/SubscribedPodcastTable";

function isPodcastLibraryTab(value: string): value is PodcastLibraryTab {
  return value === "subscribed" || value === "created" || value === "liked";
}

export default function PodcastsPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const [activeTab, setActiveTab] = useState<PodcastLibraryTab>("subscribed");
  const [subscribedView, setSubscribedView] = useState<PodcastViewMode>("list");
  const subscribedPodcastsQuery = useSubscribedPodcastsQuery();
  const createdPodcastsQuery = useCreatedPodcastsQuery();
  const likedVoicesQuery = useLikedVoicesQuery();
  const recommendedPodcastsQuery = useRecommendedPodcastsQuery();

  const handleTabChange = (value: string) => {
    if (isPodcastLibraryTab(value)) setActiveTab(value);
  };

  const emptyState = (
    <QuietState
      icon={Podcast}
      title={t("library.empty.podcasts.title")}
      description={t("library.empty.podcasts.description")}
    />
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5">
        <h1 className="text-3xl font-bold text-content">{t("library.title.podcasts")}</h1>
        {isLoggedIn && activeTab === "subscribed" ? (
          <PodcastViewToggle value={subscribedView} onChange={setSubscribedView} />
        ) : null}
      </header>
      {isLoggedIn ? (
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
          <TabsTrigger
            value="subscribed"
            className="shrink-0 rounded-full border border-content/10 bg-content/5"
          >
            {t("library.podcasts.subscribed")}
          </TabsTrigger>
          <TabsTrigger
            value="created"
            className="shrink-0 rounded-full border border-content/10 bg-content/5"
          >
            {t("library.podcasts.created")}
          </TabsTrigger>
          <TabsTrigger
            value="liked"
            className="shrink-0 rounded-full border border-content/10 bg-content/5"
          >
            {t("library.podcasts.likedVoices")}
          </TabsTrigger>
        </TabsList>
      ) : null}

      {!isLoggedIn ? (
        <QuietState icon={Podcast} title={t("library.loggedOut.podcasts")} />
      ) : (
        <>
          <TabsContent value="subscribed" className="mt-8">
            <LibraryContentState
              hasItems={(subscribedPodcastsQuery.data?.length ?? 0) > 0}
              isError={subscribedPodcastsQuery.isError}
              isLoading={subscribedPodcastsQuery.isLoading}
              isRetrying={subscribedPodcastsQuery.isRefetching}
              emptyState={emptyState}
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
              emptyState={emptyState}
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
              emptyState={emptyState}
              onRetry={() => void likedVoicesQuery.refetch()}
            >
              <LikedVoiceList voices={likedVoicesQuery.data ?? []} />
            </LibraryContentState>
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

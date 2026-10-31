"use client";

import { Podcast } from "lucide-react";
import { useState } from "react";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { QuietState } from "@/components/shared/QuietState";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { PodcastsEmptyState } from "./_components/PodcastsEmptyState";
import { PodcastsHeader } from "./_components/PodcastsHeader";
import { PodcastsTabList } from "./_components/PodcastsTabList";
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

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <PodcastsHeader
        onViewChange={setSubscribedView}
        showViewToggle={isLoggedIn && activeTab === "subscribed"}
        view={subscribedView}
      />
      {isLoggedIn ? <PodcastsTabList /> : null}

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
              emptyState={<PodcastsEmptyState />}
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
              emptyState={<PodcastsEmptyState />}
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
              emptyState={<PodcastsEmptyState />}
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

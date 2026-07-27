"use client";

import { useState } from "react";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreatedPodcastsQuery,
  useSubscribedPodcastsQuery,
} from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { PodcastLibraryTab } from "@/types/library";

function isPodcastLibraryTab(value: string): value is PodcastLibraryTab {
  return (
    value === "subscribed" ||
    value === "created" ||
    value === "purchased" ||
    value === "likedVoices"
  );
}

export default function PodcastsPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const router = useSmartRouter();
  const [activeTab, setActiveTab] = useState<PodcastLibraryTab>("subscribed");
  const subscribedPodcastsQuery = useSubscribedPodcastsQuery();
  const createdPodcastsQuery = useCreatedPodcastsQuery();
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
    <main className="min-h-screen bg-[#121212] px-6 pt-24 pb-28 md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <LibraryPageHeader title={t("library.title.podcasts")} />
        {!isLoggedIn ? (
          <LoginRequiredPrompt
            reason="library"
            onLogin={() => router.push("/login?reason=library")}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                value="purchased"
                className="shrink-0 rounded-full border border-white/10 bg-white/5"
              >
                {t("library.podcasts.purchased")}
              </TabsTrigger>
              <TabsTrigger
                value="likedVoices"
                className="shrink-0 rounded-full border border-white/10 bg-white/5"
              >
                {t("library.podcasts.likedVoices")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscribed" className="mt-8">
              <LibraryContentState
                hasItems={(subscribedPodcastsQuery.data?.length ?? 0) > 0}
                isError={subscribedPodcastsQuery.isError}
                isLoading={subscribedPodcastsQuery.isLoading}
                isRetrying={subscribedPodcastsQuery.isRefetching}
                emptyState={unavailableState}
                onRetry={() => void subscribedPodcastsQuery.refetch()}
              >
                <LibraryMediaGrid items={subscribedPodcastsQuery.data ?? []} />
              </LibraryContentState>
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

            <TabsContent value="purchased" className="mt-8">
              {unavailableState}
            </TabsContent>
            <TabsContent value="likedVoices" className="mt-8">
              {unavailableState}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}

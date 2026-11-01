"use client";

import { MessagesSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuietState } from "@/components/shared/QuietState";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useSocialViewport } from "@/hooks/social/useSocialViewport";
import { useUserFansGroupsQuery } from "@/hooks/fansGroup/useFansGroupQueries";
import { SOCIAL_DISCOVERY_GROUP } from "@/constants/social";
import { useTranslation } from "react-i18next";

import { SocialFeed } from "@/components/social/SocialFeed";
import { SocialPeople } from "@/components/social/SocialPeople";
import { SocialSearchForm } from "./SocialSearchForm";
import { SocialNotesFeed } from "./SocialNotesFeed";
import { SocialFansGroupRail } from "./SocialFansGroupRail";
import { SocialAggregatedNotesFeed } from "./SocialAggregatedNotesFeed";
import { SocialHeader } from "./SocialHeader";
import { SocialPostModal } from "./SocialPostModal";
import { cn } from "@/lib/utils";
import {
  socialPageClass,
  socialSectionTitleClass,
  socialStreamPageClass,
} from "@/components/social/socialClasses";

export function SocialStream() {
  const { t } = useTranslation();
  const { uid } = useSocialAccount();
  const router = useRouter();
  const params = useSearchParams();
  const pageRef = useSocialViewport();

  const userGroupsQuery = useUserFansGroupsQuery();
  const userGroups = userGroupsQuery.data ?? [];
  const hasUserGroups = userGroups.length > 0;

  const view = params.get("view");
  const people = view === "people",
    following = view === "following";
  const search = params.get("query") ?? "";
  const requestedGroup = params.get("group") ?? "";

  const isAggregated = hasUserGroups && (!requestedGroup || requestedGroup === "all");
  const selectedGroupId = /^\d+$/.test(requestedGroup)
    ? requestedGroup
    : isAggregated
      ? "all"
      : null;
  const groupId = /^\d+$/.test(requestedGroup)
    ? requestedGroup
    : isAggregated
      ? "all"
      : SOCIAL_DISCOVERY_GROUP;

  const handleSelectGroup = (gid: string | null) => {
    if (!gid || gid === "all") {
      router.push("/social", { scroll: false });
    } else {
      router.push(`/social?group=${gid}`, { scroll: false });
    }
  };

  return (
    <div ref={pageRef} className={cn(socialPageClass, socialStreamPageClass)}>
      {/* 动态页铺满面板宽度做瀑布流，超宽屏时限制总宽避免列过多 */}
      <div className="relative z-1 m-auto block min-h-[calc(var(--social-viewport-height,100dvh)-52px)] max-w-310">
        <main className="min-w-0">
          <SocialHeader
            view={people ? "people" : following ? "friends" : "hot"}
            groupId={groupId}
            groups={userGroups}
          />
          {!uid ? (
            <QuietState icon={MessagesSquare} title={t("social.login")} />
          ) : people ? (
            <section className="mx-auto max-w-170 py-5">
              <SocialSearchForm key={search} query={search} />
              <h2 className={socialSectionTitleClass}>
                {t(search ? "social.searchResults" : "social.following")}
              </h2>
              <SocialPeople
                key={search}
                uid={uid}
                mode={search ? "search" : "following"}
                query={search}
              />
            </section>
          ) : following ? (
            <SocialFeed grid />
          ) : (
            <>
              {hasUserGroups && (
                <SocialFansGroupRail
                  groups={userGroups}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={handleSelectGroup}
                />
              )}
              {isAggregated ? (
                <SocialAggregatedNotesFeed key="aggregated" groups={userGroups} />
              ) : (
                <SocialNotesFeed key={groupId} groupId={groupId} />
              )}
            </>
          )}
        </main>
      </div>
      {uid && <SocialPostModal />}
    </div>
  );
}

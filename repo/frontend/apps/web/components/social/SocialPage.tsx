"use client";

import { useSearchParams } from "next/navigation";
import { AppBackground } from "@/components/shared/AppBackground";
import { useSocialAccount, useSocialHotTopics } from "@/hooks/social/useSocialQueries";
import { useSocialViewport } from "@/hooks/social/useSocialViewport";
import { SOCIAL_DISCOVERY_GROUP } from "@/constants/social";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import { SocialLogin } from "./SocialPrimitives";
import { SocialFeed } from "./SocialFeed";
import { SocialPeople } from "./SocialPeople";
import { SocialSearchForm } from "./SocialSearchForm";
import { SocialHotFeed } from "./SocialHotFeed";
import { SocialNotesFeed } from "./SocialNotesFeed";
import { SocialSidebar } from "./SocialSidebar";
import { SocialHeader } from "./SocialHeader";
import s from "./Social.module.css";

export function SocialPage() {
  const { account } = useSocialAccount();
  return <SocialPageContent key={account} />;
}
function SocialPageContent() {
  const { t } = useI18n();
  const { uid } = useSocialAccount();
  const params = useSearchParams();
  const pageRef = useSocialViewport();
  const view = params.get("view");
  const people = view === "people",
    following = view === "following";
  const search = params.get("query") ?? "";
  const topics = useSocialHotTopics();
  const items = uniqueById(topics.data?.pages.flatMap((page) => page.items) ?? []);
  const requestedTopic = params.get("topic") ?? "";
  const requestedGroup = params.get("group") ?? "";
  const groupId = /^\d+$/.test(requestedGroup) ? requestedGroup : SOCIAL_DISCOVERY_GROUP;
  const topic = /^\d+$/.test(requestedTopic)
    ? (items.find((item) => item.id === requestedTopic) ?? {
        id: requestedTopic,
        title: params.get("title") || t("social.hotTopics"),
        description: "",
        cover: "",
        participants: 0,
      })
    : undefined;
  return (
    <div ref={pageRef} className={s.page + " " + s.streamPage}>
      <AppBackground />
      <div className={s.feedLayout}>
        <main className={s.main}>
          <SocialHeader
            view={people ? "people" : following ? "friends" : "hot"}
            topicId={topic?.id}
            groupId={groupId}
          />
          {!uid ? (
            <SocialLogin />
          ) : people ? (
            <section className={s.peopleBrowser}>
              <SocialSearchForm key={search} query={search} />
              <h2 className={s.sectionTitle}>
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
            <SocialFeed />
          ) : topic ? (
            <SocialHotFeed key={topic.id} topic={topic} />
          ) : (
            <SocialNotesFeed key={groupId} groupId={groupId} />
          )}
        </main>
        {uid && <SocialSidebar selectedId={topic?.id} />}
      </div>
    </div>
  );
}

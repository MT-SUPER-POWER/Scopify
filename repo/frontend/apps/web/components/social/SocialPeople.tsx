"use client";

import { useSocialAccount, useSocialPeople } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialPeopleProps } from "@/types/components/social";
import {
  FollowButton,
  SocialAuthor,
  SocialAvatar,
  SocialLoadMore,
  SocialLogin,
  SocialState,
} from "./SocialPrimitives";
import s from "./Social.module.css";

export function SocialPeople({
  uid = "",
  mode,
  query: search = "",
  compact = false,
}: SocialPeopleProps) {
  const { t } = useI18n(),
    { uid: self } = useSocialAccount();
  const query = useSocialPeople(uid || self, mode, search);
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  if (!self) return <SocialLogin />;
  return (
    <SocialState
      loading={query.isPending}
      error={query.isError && !items.length}
      onRetry={() => void query.refetch()}
      empty={
        !items.length
          ? t(mode === "search" ? "social.emptySearch" : "social.emptyPeople")
          : undefined
      }
    >
      {(compact ? items.slice(0, 5) : items).map((user) => (
        <div className={s.person} key={user.id}>
          <SocialAvatar user={user} size={compact ? "small" : undefined} />
          <div className={s.personText}>
            <SocialAuthor user={user} />
            <p>{user.signature || t("social.noSignature")}</p>
          </div>
          {!compact && <FollowButton user={user} />}
        </div>
      ))}
      {!compact && (
        <SocialLoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          error={query.isError}
          onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
        />
      )}
    </SocialState>
  );
}

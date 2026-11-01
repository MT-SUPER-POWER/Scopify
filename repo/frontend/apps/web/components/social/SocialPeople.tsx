"use client";

import { useSocialAccount, useSocialPeople } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useTranslation } from "react-i18next";

import type { SocialPeopleProps } from "@/types/social/components";
import {
  FollowButton,
  SocialAuthor,
  SocialAvatar,
  SocialLoadMore,
  SocialLogin,
  SocialState,
} from "./SocialPrimitives";

export function SocialPeople({ uid = "", mode, query: search = "" }: SocialPeopleProps) {
  const { t } = useTranslation(),
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
      {items.map((user) => (
        <div className="flex items-center gap-3 border-b border-foreground/10 py-4" key={user.id}>
          <SocialAvatar user={user} />
          <div className="min-w-0 flex-1">
            <SocialAuthor user={user} />
            <p className="mt-1 truncate text-[12px] text-muted-foreground">
              {user.signature || t("social.noSignature")}
            </p>
          </div>
          <FollowButton user={user} />
        </div>
      ))}
      <SocialLoadMore
        more={query.hasNextPage}
        pending={query.isFetching}
        error={query.isError}
        onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
      />
    </SocialState>
  );
}

"use client";

import { useSocialAccount, useSocialEvent } from "@/hooks/social/useSocialQueries";
import { useTranslation } from "react-i18next";

import type { SocialEventDetailProps } from "@/types/social/components";
import { SocialEventCard } from "@/components/social/SocialEventCard";
import { SocialLogin, SocialState } from "@/components/social/SocialPrimitives";
import { socialPageClass } from "@/components/social/socialClasses";
import { SocialComments } from "./SocialComments";

export function SocialEventDetail({ target }: SocialEventDetailProps) {
  const { t } = useTranslation(),
    { uid } = useSocialAccount();
  const valid = /^\d+$/.test(target.id) && /^\d+$/.test(target.uid);
  const query = useSocialEvent(valid ? target : { id: "", uid: "" });
  return (
    <div className={socialPageClass}>
      <main className="relative z-1 m-auto max-w-[850px]">
        <h1 className="mb-3 text-[24px] font-bold">{t("social.detail")}</h1>
        {!uid ? (
          <SocialLogin />
        ) : !valid ? (
          <SocialState empty={t("social.unavailable")} />
        ) : (
          <SocialState
            loading={query.isPending}
            error={query.isError && !query.data}
            onRetry={() => void query.refetch()}
            empty={!query.data ? t("social.unavailable") : undefined}
          >
            {query.data && (
              <>
                <SocialEventCard event={query.data} detail />
                <SocialComments event={query.data} />
              </>
            )}
          </SocialState>
        )}
      </main>
    </div>
  );
}

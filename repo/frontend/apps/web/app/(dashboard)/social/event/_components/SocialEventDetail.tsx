"use client";

import { useSocialAccount, useSocialEvent } from "@/hooks/social/useSocialQueries";
import { useI18n } from "@/store/module/i18n";
import type { SocialEventDetailProps } from "@/types/social/components";
import { SocialEventCard } from "@/components/social/SocialEventCard";
import { SocialLogin, SocialState } from "@/components/social/SocialPrimitives";
import s from "@/components/social/Social.module.css";
import { SocialComments } from "./SocialComments";

export function SocialEventDetail({ target }: SocialEventDetailProps) {
  const { t } = useI18n(),
    { uid } = useSocialAccount();
  const valid = /^\d+$/.test(target.id) && /^\d+$/.test(target.uid);
  const query = useSocialEvent(valid ? target : { id: "", uid: "" });
  return (
    <div className={s.page}>
      <main className={s.detail}>
        <h1 className={s.detailHeading}>{t("social.detail")}</h1>
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

"use client";

import { useSearchParams } from "next/navigation";
import { AppBackground } from "@/components/shared/AppBackground";
import { useSocialAccount, useSocialEvent } from "@/hooks/social/useSocialQueries";
import { useI18n } from "@/store/module/i18n";
import type { SocialEventDetailProps } from "@/types/components/social";
import { SocialEventCard } from "./SocialEventCard";
import { SocialComments } from "./SocialComments";
import { SocialLogin, SocialState } from "./SocialPrimitives";
import s from "./Social.module.css";

export function SocialEventPage() {
  const params = useSearchParams(),
    { account } = useSocialAccount();
  const target = { id: params.get("id") ?? "", uid: params.get("uid") ?? "" };
  return <SocialEventDetail key={account + ":" + target.id} target={target} />;
}
function SocialEventDetail({ target }: SocialEventDetailProps) {
  const { t } = useI18n(),
    { uid } = useSocialAccount();
  const valid = /^\d+$/.test(target.id) && /^\d+$/.test(target.uid);
  const query = useSocialEvent(valid ? target : { id: "", uid: "" });
  return (
    <div className={s.page}>
      <AppBackground />
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

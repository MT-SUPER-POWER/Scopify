"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSocialAccount, useSocialEvent } from "@/hooks/social/useSocialQueries";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { profileHref } from "@/lib/social/normalize";
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
    { uid } = useSocialAccount(),
    router = useSmartRouter();
  const valid = /^\d+$/.test(target.id) && /^\d+$/.test(target.uid);
  const query = useSocialEvent(valid ? target : { id: "", uid: "" });
  return (
    <div className={s.page}>
      <main className={s.detail}>
        <div className={s.profileTop}>
          <button
            type="button"
            className={s.iconButton}
            aria-label={t("social.back")}
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/social"))}
          >
            <ArrowLeft />
          </button>
          <h1 className="text-lg font-bold">{t("social.detail")}</h1>
          <Link href="/social" scroll={false} className={s.textButton + " ml-auto"}>
            {t("social.back")}
          </Link>
        </div>
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
        {valid && !query.isPending && !query.data && (
          <Link scroll={false} href={profileHref(target.uid)} className={s.button}>
            {t("social.backProfile")}
          </Link>
        )}
      </main>
    </div>
  );
}

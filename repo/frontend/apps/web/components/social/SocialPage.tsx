"use client";

import { ArrowUpRight, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocialAccount, useSocialProfile } from "@/hooks/social/useSocialQueries";
import { socialKey } from "@/lib/social/cache";
import { profileHref } from "@/lib/social/normalize";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import { SocialAvatar, SocialLogin } from "./SocialPrimitives";
import { SocialComposer } from "./SocialComposer";
import { SocialFeed } from "./SocialFeed";
import { SocialPeople } from "./SocialPeople";
import s from "./Social.module.css";

export function SocialPage() {
  const { account } = useSocialAccount();
  const params = useSearchParams();
  return (
    <SocialPageContent
      key={account + ":" + (params.get("view") ?? "") + ":" + (params.get("query") ?? "")}
    />
  );
}
function SocialPageContent() {
  const { t } = useI18n(),
    { uid, account } = useSocialAccount(),
    params = useSearchParams(),
    router = useSmartRouter(),
    client = useQueryClient();
  const people = params.get("view") === "people",
    query = params.get("query") ?? "";
  const [search, setSearch] = useState(query);
  const profile = useSocialProfile(uid);
  return (
    <div className={s.page}>
      <div className={s.feedLayout}>
        <main className={s.main}>
          <div className={s.heading}>
            <div>
              <h1>{t("social.title")}</h1>
              <p>{t("social.subtitle")}</p>
            </div>
            <button
              type="button"
              className={s.iconButton}
              aria-label={t("social.refresh")}
              onClick={() =>
                void client.invalidateQueries({
                  queryKey: socialKey(account, people ? "people" : "events"),
                })
              }
            >
              <RefreshCw />
            </button>
          </div>
          <nav className={s.tabs} aria-label={t("social.title")}>
            <Link href="/social" scroll={false} className={s.tab} data-active={!people}>
              {t("social.feed")}
            </Link>
            <Link href="/social?view=people" scroll={false} className={s.tab} data-active={people}>
              {t("social.following")}
            </Link>
            {uid && (
              <Link href={profileHref(uid)} scroll={false} className={s.tab}>
                {t("social.myProfile")}
              </Link>
            )}
          </nav>
          {!uid ? (
            <SocialLogin />
          ) : people ? (
            <>
              <form
                className={s.search}
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push("/social", { view: "people", query: search.trim() || undefined });
                }}
              >
                <Search />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t("social.searchPeople")}
                  placeholder={t("social.searchPeople")}
                />
                <button type="submit" className={s.textButton}>
                  {t("social.search")}
                </button>
              </form>
              <SocialPeople
                key={query}
                uid={uid}
                mode={query ? "search" : "following"}
                query={query}
              />
            </>
          ) : (
            <>
              <SocialComposer />
              <SocialFeed />
            </>
          )}
        </main>
        <aside className={s.rail}>
          <section className={s.railSection}>
            <div className={s.sectionTitle}>
              <h2>{t("social.following")}</h2>
              <Link href="/social?view=people" scroll={false} className={s.textButton}>
                {t("social.all")}
              </Link>
            </div>
            {uid && <SocialPeople uid={uid} mode="following" compact />}
          </section>
          {profile.data && (
            <section className={s.railSection}>
              <div className={s.sectionTitle}>
                <h2>{t("social.myProfile")}</h2>
                <ArrowUpRight className="size-4 text-content-muted" />
              </div>
              <Link href={profileHref(uid)} scroll={false} className={s.row}>
                <SocialAvatar user={profile.data} linked={false} />
                <strong>{profile.data.name}</strong>
              </Link>
              <p className={s.bio + " mt-4"}>{profile.data.signature || t("social.noSignature")}</p>
              <div className={s.stats}>
                <Link href={profileHref(uid) + "&tab=following"} scroll={false}>
                  <strong>{profile.data.following}</strong>
                  {t("social.following")}
                </Link>
                <Link href={profileHref(uid) + "&tab=followers"} scroll={false}>
                  <strong>{profile.data.followers}</strong>
                  {t("social.followers")}
                </Link>
              </div>
            </section>
          )}
          <p className={s.muted}>{t("social.feedDescription")}</p>
        </aside>
      </div>
    </div>
  );
}

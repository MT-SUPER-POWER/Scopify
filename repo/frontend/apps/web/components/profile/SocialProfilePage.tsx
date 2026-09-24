"use client";

import { ArrowLeft, CalendarDays, Disc3, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  useSocialAccount,
  useSocialPlaylists,
  useSocialProfile,
} from "@/hooks/social/useSocialQueries";
import { useSocialEditProfile } from "@/hooks/social/useSocialActions";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { profileHref, uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import {
  SocialAvatar,
  FollowButton,
  SocialLogin,
  SocialState,
} from "@/components/social/SocialPrimitives";
import { SocialComposer } from "@/components/social/SocialComposer";
import { SocialFeed } from "@/components/social/SocialFeed";
import { SocialPeople } from "@/components/social/SocialPeople";
import { SocialMessageDialog } from "@/components/social/SocialMessageDialog";
import { EditUserProfileDialog } from "./EditUserProfileDialog";
import { SocialProfilePlaylists } from "./SocialProfilePlaylists";
import type { SocialFeedProps } from "@/types/components/social";
import s from "@/components/social/Social.module.css";

export function SocialProfilePage() {
  const { uid: self, account } = useSocialAccount(),
    params = useSearchParams();
  const uid = params.get("userId") || self;
  return <SocialProfileContent key={account + ":" + uid} uid={/^\d+$/.test(uid) ? uid : ""} />;
}
function SocialProfileContent({ uid = "" }: SocialFeedProps) {
  const { t } = useI18n(),
    { uid: self } = useSocialAccount(),
    params = useSearchParams(),
    router = useSmartRouter();
  const tab = params.get("tab") ?? "activity",
    isSelf = self === uid;
  const query = useSocialProfile(uid),
    playlists = useSocialPlaylists(uid);
  const edit = useSocialEditProfile(),
    requireLogin = useRequireLoginAction();
  const [editing, setEditing] = useState(false);
  const messaging = !isSelf && !!self && params.get("action") === "message";
  const user = query.data;
  const miniPlaylists = uniqueById(playlists.data?.pages.flatMap((page) => page.items) ?? [])
    .filter((item) => item.creator === uid)
    .slice(0, 3);
  if (!uid)
    return (
      <div className={s.page}>
        {self ? <SocialState empty={t("social.noProfile")} /> : <SocialLogin />}
      </div>
    );
  return (
    <div className={s.page}>
      <div className={s.profileTop}>
        <button
          type="button"
          className={s.iconButton}
          aria-label={t("social.back")}
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/social"))}
        >
          <ArrowLeft />
        </button>
        <Link href="/social" scroll={false}>
          {t("social.back")}
        </Link>
        <span className={s.muted}>{user?.name}</span>
      </div>
      <SocialState
        loading={query.isPending}
        error={query.isError && !user}
        onRetry={() => void query.refetch()}
      >
        {user && (
          <>
            {query.isError && (
              <p role="alert" className={s.muted}>
                {t("social.failed")}{" "}
                <button type="button" className={s.textButton} onClick={() => void query.refetch()}>
                  {t("social.retry")}
                </button>
              </p>
            )}
            <div className={s.banner}>
              {user.cover && <img src={user.cover} alt="" referrerPolicy="no-referrer" />}
            </div>
            <div className={s.profileLayout}>
              <aside className={s.identity}>
                <SocialAvatar user={user} linked={false} size="large" />
                <h1>{user.name}</h1>
                <p className={s.bio}>{user.signature || t("social.noSignature")}</p>
                {user.joinedAt && (
                  <p className={s.row + " " + s.muted + " mt-4"}>
                    <CalendarDays className="size-3.5" />
                    {t("social.joined", { year: new Date(user.joinedAt).getFullYear() })}
                  </p>
                )}
                <div className={s.stats}>
                  <Link href={profileHref(uid) + "&tab=following"} scroll={false}>
                    <strong>{user.following}</strong>
                    {t("social.following")}
                  </Link>
                  <Link href={profileHref(uid) + "&tab=followers"} scroll={false}>
                    <strong>{user.followers}</strong>
                    {t("social.followers")}
                  </Link>
                </div>
                <div className={s.profileActions}>
                  {isSelf ? (
                    <button
                      type="button"
                      className={s.button}
                      onClick={() => void requireLogin(() => setEditing(true))}
                    >
                      {t("social.edit")}
                    </button>
                  ) : (
                    <>
                      <FollowButton user={user} />
                      <button
                        type="button"
                        className={s.button}
                        onClick={() =>
                          void requireLogin(() =>
                            router.replace("/profile", { userId: uid, tab, action: "message" }),
                          )
                        }
                      >
                        <MessageCircle className="size-4" />
                        {t("social.message")}
                      </button>
                    </>
                  )}
                </div>
                <section className={s.railSection}>
                  <div className={s.sectionTitle}>
                    <h2>{t("social.playlists")}</h2>
                    <Link
                      href={profileHref(uid) + "&tab=playlists"}
                      scroll={false}
                      className={s.textButton}
                    >
                      {t("social.all")}
                    </Link>
                  </div>
                  {miniPlaylists.map((item) => (
                    <Link
                      href={"/playlist?id=" + item.id}
                      scroll={false}
                      className={s.miniPlaylist}
                      key={item.id}
                    >
                      <span className={s.cover}>
                        {item.cover ? <img src={item.cover} alt="" loading="lazy" /> : <Disc3 />}
                      </span>
                      <span className={s.personText}>
                        <strong>{item.name}</strong>
                        <p>{t("social.tracks", { count: item.count })}</p>
                      </span>
                    </Link>
                  ))}
                  {playlists.isError && (
                    <button
                      type="button"
                      className={s.textButton}
                      onClick={() => void playlists.refetch()}
                    >
                      {t("social.retry")}
                    </button>
                  )}
                </section>
                {isSelf && (
                  <Link href="/recent" scroll={false} className={s.textButton}>
                    {t("social.recent")} →
                  </Link>
                )}
              </aside>
              <main className={s.profileContent}>
                <nav className={s.tabs} aria-label={t("social.backProfile")}>
                  {(["activity", "playlists", "about"] as const).map((item) => (
                    <Link
                      key={item}
                      href={profileHref(uid) + "&tab=" + item}
                      scroll={false}
                      className={s.tab}
                      data-active={tab === item}
                    >
                      {t(
                        ("social." + item) as
                          "social.activity" | "social.playlists" | "social.about",
                      )}
                      {item === "activity" && user.events > 0 ? (
                        <span className="ml-2 text-xs text-content-muted">{user.events}</span>
                      ) : null}
                    </Link>
                  ))}
                </nav>
                {tab === "playlists" ? (
                  <SocialProfilePlaylists uid={uid} />
                ) : tab === "about" ? (
                  <section className={s.about}>
                    <p className={s.bio}>{user.signature || t("social.noSignature")}</p>
                    <dl>
                      {user.level !== undefined && (
                        <>
                          <dt>{t("social.level")}</dt>
                          <dd>Lv. {user.level}</dd>
                        </>
                      )}
                      {user.listenSongs !== undefined && (
                        <>
                          <dt>{t("social.listened")}</dt>
                          <dd>{t("social.tracks", { count: user.listenSongs })}</dd>
                        </>
                      )}
                      <dt>{t("social.activity")}</dt>
                      <dd>{user.events}</dd>
                    </dl>
                  </section>
                ) : tab === "following" || tab === "followers" ? (
                  <>
                    <h2 className={s.sectionTitle + " mt-6"}>
                      {t(tab === "following" ? "social.following" : "social.followers")}
                    </h2>
                    <SocialPeople uid={uid} mode={tab} />
                  </>
                ) : (
                  <>
                    {isSelf && <SocialComposer />}
                    <SocialFeed uid={uid} />
                  </>
                )}
              </main>
            </div>
            {isSelf && (
              <EditUserProfileDialog
                open={editing}
                user={user.editable}
                saving={edit.isPending}
                onCancel={() => setEditing(false)}
                onConfirm={async (payload) => {
                  try {
                    await edit.mutateAsync(payload);
                    setEditing(false);
                  } catch {
                    /* Keep edits. */
                  }
                }}
              />
            )}
            <SocialMessageDialog
              key={uid}
              user={user}
              open={messaging}
              onClose={() => router.replace("/profile", { userId: uid, tab })}
            />
          </>
        )}
      </SocialState>
    </div>
  );
}

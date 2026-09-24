"use client";

import { LoaderCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/store/module/i18n";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { profileHref } from "@/lib/social/normalize";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useSocialFollow } from "@/hooks/social/useSocialActions";
import type {
  SocialAvatarProps,
  SocialLoadMoreProps,
  SocialStateProps,
  SocialUserProps,
} from "@/types/components/social";
import s from "./Social.module.css";

export function SocialAvatar({ user, size, linked = true, className = "" }: SocialAvatarProps) {
  const { t } = useI18n();
  const content = user.avatar ? (
    <img src={user.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
  ) : (
    <UserRound aria-hidden="true" />
  );
  const classes = [
    s.avatar,
    size === "large" ? s.largeAvatar : size === "small" ? s.smallAvatar : "",
    className,
  ].join(" ");
  return linked && user.id ? (
    <Link
      scroll={false}
      href={profileHref(user.id)}
      className={classes}
      aria-label={user.name || t("social.unknownUser")}
    >
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  );
}
export function SocialAuthor({ user, className = "" }: SocialUserProps) {
  const { t } = useI18n();
  return user.id ? (
    <Link scroll={false} className={s.author + " " + className} href={profileHref(user.id)}>
      {user.name || t("social.unknownUser")}
    </Link>
  ) : (
    <span className={s.author}>{user.name || t("social.unknownUser")}</span>
  );
}
export function FollowButton({ user, className = "" }: SocialUserProps) {
  const { t } = useI18n(),
    { uid } = useSocialAccount();
  const mutation = useSocialFollow(user),
    requireLogin = useRequireLoginAction();
  if (!user.id || user.id === uid) return null;
  return (
    <button
      type="button"
      className={s.button + " " + (!user.followed ? s.primary : "") + " " + className}
      disabled={mutation.busy}
      aria-pressed={user.followed}
      aria-label={t(user.followed ? "social.unfollow" : "social.follow") + " " + user.name}
      onClick={() => void requireLogin(() => mutation.mutate(!user.followed))}
    >
      {mutation.busy ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        t(user.mutual ? "social.mutual" : user.followed ? "social.followed" : "social.follow")
      )}
    </button>
  );
}
export function SocialState({ loading, error, empty, onRetry, children }: SocialStateProps) {
  const { t } = useI18n();
  if (!loading && !error && !empty) return children;
  return (
    <div className={s.state} role={error ? "alert" : "status"}>
      {loading && <LoaderCircle className="size-6 animate-spin" />}
      <p>{loading ? t("social.loading") : error ? t("social.failed") : empty}</p>
      {error && onRetry && (
        <button type="button" className={s.button} onClick={onRetry}>
          {t("social.retry")}
        </button>
      )}
    </div>
  );
}
export function SocialLoadMore({ more, pending, error, onLoad }: SocialLoadMoreProps) {
  const { t } = useI18n();
  return (
    <div className={s.loadMore}>
      {more || error ? (
        <button type="button" className={s.button} disabled={pending} onClick={onLoad}>
          {t(pending ? "social.loading" : error ? "social.retry" : "social.loadMore")}
        </button>
      ) : (
        t("social.end")
      )}
    </div>
  );
}
export function SocialLogin() {
  const { t } = useI18n(),
    requireLogin = useRequireLoginAction();
  return (
    <div className={s.state}>
      <p>{t("social.login")}</p>
      <button
        type="button"
        className={s.button + " " + s.primary}
        onClick={() => void requireLogin(() => {})}
      >
        {t("social.loginAction")}
      </button>
    </div>
  );
}

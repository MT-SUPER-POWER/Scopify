"use client";

import { LoaderCircle, MessagesSquare, UserRound } from "lucide-react";
import Link from "next/link";
import { QuietState } from "@/components/shared/QuietState";
import { useTranslation } from "react-i18next";

import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { profileHref } from "@/lib/social/normalize";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useSocialFollow } from "@/hooks/social/useSocialActions";
import type {
  SocialAvatarProps,
  SocialLoadMoreProps,
  SocialStateProps,
  SocialUserProps,
} from "@/types/social/components";
import { cn } from "@/lib/utils";
import {
  socialAuthorClass,
  socialAvatarClass,
  socialAvatarSizeClass,
  socialButtonClass,
  socialPrimaryClass,
  socialSmallAvatarSizeClass,
  profileHeroAvatarClass,
} from "./socialClasses";

export function SocialAvatar({ user, size, linked = true, className = "" }: SocialAvatarProps) {
  const { t } = useTranslation();
  const content = user.avatar ? (
    <img src={user.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
  ) : (
    <UserRound aria-hidden="true" />
  );
  // 大头像只用于个人主页头部，尺寸随容器缩放，不受窄屏默认尺寸影响
  const classes = cn(
    socialAvatarClass,
    size === "large"
      ? profileHeroAvatarClass
      : size === "small"
        ? socialSmallAvatarSizeClass
        : socialAvatarSizeClass,
    className,
  );
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
  const { t } = useTranslation();
  return user.id ? (
    <Link scroll={false} className={cn(socialAuthorClass, className)} href={profileHref(user.id)}>
      {user.name || t("social.unknownUser")}
    </Link>
  ) : (
    <span className={cn(socialAuthorClass, className)}>{user.name || t("social.unknownUser")}</span>
  );
}
export function FollowButton({ user, className = "" }: SocialUserProps) {
  const { t } = useTranslation(),
    { uid } = useSocialAccount();
  const mutation = useSocialFollow(user),
    requireLogin = useRequireLoginAction();
  if (!user.id || user.id === uid) return null;
  return (
    <button
      type="button"
      className={cn(socialButtonClass, !user.followed && socialPrimaryClass, className)}
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
export function SocialState({
  loading,
  error,
  empty,
  onRetry,
  skeleton,
  children,
}: SocialStateProps) {
  const { t } = useTranslation();
  if (loading && skeleton) return skeleton;
  if (!loading && !error && !empty) return children;
  return (
    <div
      className="leading-1.7 flex flex-col items-center justify-center gap-[15px] px-5 py-[50px] text-center text-[14px] text-muted-foreground"
      role={error ? "alert" : "status"}
    >
      {loading && <LoaderCircle className="size-6 animate-spin" />}
      <p>{loading ? t("social.loading") : error ? t("social.failed") : empty}</p>
      {error && onRetry && (
        <button type="button" className={socialButtonClass} onClick={onRetry}>
          {t("social.retry")}
        </button>
      )}
    </div>
  );
}
export function SocialLoadMore({ more, pending, error, onLoad }: SocialLoadMoreProps) {
  const { t } = useTranslation();
  if (!more && !error) return null;
  return (
    <div className="px-2.5 py-6 text-center text-[12px] text-muted-foreground">
      <button type="button" className={socialButtonClass} disabled={pending} onClick={onLoad}>
        {t(pending ? "social.loading" : error ? "social.retry" : "social.loadMore")}
      </button>
    </div>
  );
}
export function SocialLogin() {
  const { t } = useTranslation();
  return <QuietState compact icon={MessagesSquare} title={t("social.login")} />;
}

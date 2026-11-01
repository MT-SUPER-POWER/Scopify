"use client";

import { useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { useSocialAccount, useSocialProfile } from "@/hooks/social/useSocialQueries";
import { useSocialEditProfile } from "@/hooks/social/useSocialActions";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useCoverThemeColor } from "@/hooks/playlist/useCoverThemeColor";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";

import { SocialLogin, SocialState } from "@/components/social/SocialPrimitives";
import { ProfileSkeletonContent } from "@/components/profile/ProfilePageSkeleton";
import type { SocialFeedProps } from "@/types/social/components";
import {
  profileShellClass,
  socialMutedClass,
  socialTextButtonClass,
} from "@/components/social/socialClasses";

/** 头部背景光：左上角主题色光晕叠在头像取色（--profile-tint）到面板底色的渐变上。 */
const profileGlowClass =
  "pointer-events-none absolute inset-x-0 top-0 z-0 h-[480px] animate-in bg-[radial-gradient(60%_90%_at_12%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%),linear-gradient(to_bottom,color-mix(in_oklab,var(--profile-tint,var(--secondary))_62%,var(--card))_0%,var(--card)_100%)] duration-500 ease-out fade-in fill-mode-both";
import { EditUserProfileDialog } from "./EditUserProfileDialog";
import { SocialMessageDialog } from "./SocialMessageDialog";
import { SocialProfileBody } from "./SocialProfileBody";
import { SocialProfileHero } from "./SocialProfileHero";

export function ProfileContent({ uid = "" }: SocialFeedProps) {
  const { t } = useTranslation();
  const { uid: self } = useSocialAccount();
  const params = useSearchParams(),
    router = useSmartRouter();
  const requestedTab = params.get("tab") ?? "overview";
  const tab = ["overview", "playlists", "activity", "following", "followers"].includes(requestedTab)
    ? requestedTab
    : "overview";
  const isSelf = self === uid;
  const query = useSocialProfile(uid);
  const edit = useSocialEditProfile(),
    requireLogin = useRequireLoginAction();
  const [editing, setEditing] = useState(false);
  const messaging = !isSelf && !!self && params.get("action") === "message";
  const user = query.data;
  const tint = useCoverThemeColor(user?.avatar ? getSizedImageUrl(user.avatar, 100) : null);
  return (
    <>
      {user && (
        <div
          className={profileGlowClass}
          style={tint ? ({ "--profile-tint": tint } as CSSProperties) : undefined}
          aria-hidden="true"
        />
      )}
      <div className={profileShellClass}>
        {!uid ? (
          self ? (
            <SocialState empty={t("social.noProfile")} />
          ) : (
            <SocialLogin />
          )
        ) : (
          <SocialState error={query.isError && !user} onRetry={() => void query.refetch()}>
            {query.isPending && <ProfileSkeletonContent />}
            {user && (
              <>
                {query.isError && (
                  <p role="alert" className={socialMutedClass}>
                    {t("social.failed")}{" "}
                    <button
                      type="button"
                      className={socialTextButtonClass}
                      onClick={() => void query.refetch()}
                    >
                      {t("social.retry")}
                    </button>
                  </p>
                )}
                <SocialProfileHero
                  user={user}
                  isSelf={isSelf}
                  onEdit={() => void requireLogin(() => setEditing(true))}
                  onMessage={() =>
                    void requireLogin(() =>
                      router.replace("/profile", { userId: uid, tab, action: "message" }),
                    )
                  }
                />
                <SocialProfileBody user={user} isSelf={isSelf} tab={tab} />
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
        )}
      </div>
    </>
  );
}

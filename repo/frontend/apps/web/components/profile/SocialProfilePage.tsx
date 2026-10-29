"use client";

import { useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { useCoverThemeColor } from "@/hooks/playlist/useCoverThemeColor";
import { useSocialAccount, useSocialProfile } from "@/hooks/social/useSocialQueries";
import { useSocialEditProfile } from "@/hooks/social/useSocialActions";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useI18n } from "@/store/module/i18n";
import { SocialLogin, SocialState } from "@/components/social/SocialPrimitives";
import { SocialMessageDialog } from "@/components/social/SocialMessageDialog";
import { EditUserProfileDialog } from "./EditUserProfileDialog";
import { SocialProfileHero } from "./SocialProfileHero";
import { ProfileSkeletonContent } from "./ProfilePageSkeleton";
import { SocialProfileBody } from "./SocialProfileBody";
import type { SocialFeedProps } from "@/types/social/components";
import s from "@/components/social/Social.module.css";

export function SocialProfilePage() {
  const { uid: self, account } = useSocialAccount();
  const params = useSearchParams();
  const uid = params.get("userId") || self;
  return <SocialProfileContent key={account + ":" + uid} uid={/^\d+$/.test(uid) ? uid : ""} />;
}
function SocialProfileContent({ uid = "" }: SocialFeedProps) {
  const { t } = useI18n();
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
    <div
      className={s.page + " " + s.profilePage}
      style={tint ? ({ "--profile-tint": tint } as CSSProperties) : undefined}
    >
      {user && <div className={s.profileGlow} aria-hidden="true" />}
      <div className={s.profileShell}>
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
                  <p role="alert" className={s.muted}>
                    {t("social.failed")}{" "}
                    <button
                      type="button"
                      className={s.textButton}
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
    </div>
  );
}

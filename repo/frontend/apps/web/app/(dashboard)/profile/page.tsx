"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import TracklistTable from "@/components/Playlist/TrackTable";
import { EditUserProfileDialog } from "@/components/profile/EditUserProfileDialog";
import { PublicPlaylistGrid } from "@/components/profile/PublicPlaylistGrid";
import { UserActionBar } from "@/components/profile/UserActionBar";
import { UserHero } from "@/components/profile/UserHero";
import { useUserData } from "@/hooks/profile/useUserData";
import { updateUserProfile } from "@/lib/api/user";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { UpdateUserProfilePayload } from "@/types/api/profileUpdate";
import type { NeteaseUser } from "@/types/api/user";

export default function ProfilePage() {
  const { t } = useI18n();
  const uid = useSearchParams().get("userId");
  const router = useSmartRouter();
  const requireLoginAction = useRequireLoginAction();
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileOverride, setProfileOverride] = useState<NeteaseUser | null>(null);

  const { userInfo, playlists, recentSongs, recentPlaylists, themeColor, isLoading, isSelf } =
    useUserData(uid);

  if (!uid)
    return (
      <div className="bg-surface-raised text-content h-full p-8">
        {t("profile.page.invalidUserId") || "Invalid User ID"}
      </div>
    );

  if (isLoading || !userInfo)
    return (
      <div className="bg-surface-raised flex h-full min-h-screen items-center justify-center">
        <Loader2 className="text-brand size-8 animate-spin" />
      </div>
    );

  const displayUser = profileOverride ?? userInfo;

  const handleSaveProfile = async (payload: UpdateUserProfilePayload) => {
    await requireLoginAction("profile-edit", async () => {
      setSavingProfile(true);
      try {
        await updateUserProfile(payload);
        const nextUser = { ...displayUser, ...payload };
        setProfileOverride(nextUser);
        useUserStore.getState().setUser(nextUser);
        setEditOpen(false);
        toast.success(t("profile.toast.updateSuccess") || "Profile updated");
      } catch {
        toast.error(t("profile.toast.updateFailed") || "Update failed");
      } finally {
        setSavingProfile(false);
      }
    });
  };

  return (
    <div className="bg-surface-raised text-content relative flex min-h-screen w-full flex-col pb-24 font-sans">
      {/* Background blend */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 opacity-60 md:h-125"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
      />

      <UserHero userInfo={displayUser} playlistCount={playlists.length} />

      <div className="hero-content-transition relative z-10 flex flex-1 flex-col">
        <UserActionBar
          isSelf={isSelf}
          onEdit={() => void requireLoginAction("profile-edit", () => setEditOpen(true))}
        />

        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="space-y-12">
            {!isSelf ? (
              <section>
                <h2 className="mb-6 text-2xl font-bold">
                  {t("profile.page.publicPlaylists") || "公开歌单"}
                </h2>
                {playlists.length > 0 ? (
                  <PublicPlaylistGrid
                    playlists={playlists}
                    onClickPlaylist={(id) => router.push(`/playlist?id=${id}`)}
                  />
                ) : (
                  <div className="text-content/40 py-12 text-center">
                    {t("profile.page.noPublicPlaylists") || "暂无公开歌单"}
                  </div>
                )}
              </section>
            ) : (
              <>
                <section>
                  <h2 className="mb-6 text-2xl font-bold">
                    {t("profile.page.recentSongs") || "最近播放歌曲"}
                  </h2>
                  {recentSongs.length > 0 ? (
                    <TracklistTable
                      tracks={recentSongs}
                      disableVirtualization
                      hideDateColumn
                      readonly
                    />
                  ) : (
                    <div className="text-content/40 py-4 text-sm">
                      {t("profile.page.noRecentSongs") || "暂无最近播放歌曲"}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="mb-6 text-2xl font-bold">
                    {t("profile.page.recentPlaylists") || "最近播放歌单"}
                  </h2>
                  {recentPlaylists.length > 0 ? (
                    <PublicPlaylistGrid
                      playlists={recentPlaylists}
                      onClickPlaylist={(id) => router.push(`/playlist?id=${id}`)}
                    />
                  ) : (
                    <div className="text-content/40 py-4 text-sm">
                      {t("profile.page.noRecentPlaylists") || "暂无最近播放歌单"}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      <EditUserProfileDialog
        open={editOpen}
        user={displayUser}
        saving={savingProfile}
        onCancel={() => setEditOpen(false)}
        onConfirm={handleSaveProfile}
      />
    </div>
  );
}

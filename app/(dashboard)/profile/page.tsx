"use client";

import { ChevronUp, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { UpdateUserProfilePayload } from "@/types/api/profileUpdate";
import type { NeteaseUser } from "@/types/api/user";

export default function ProfilePage() {
  const { t } = useI18n();
  const uid = useSearchParams().get("userId");
  const router = useSmartRouter();
  const requireLoginAction = useRequireLoginAction();
  const [playlistsOpen, setPlaylistsOpen] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileOverride, setProfileOverride] = useState<NeteaseUser | null>(null);

  const { userInfo, playlists, recentSongs, recentPlaylists, themeColor, isLoading, isSelf } =
    useUserData(uid);

  if (!uid)
    return (
      <div className="p-8 text-white h-full bg-[#121212]">{t("profile.page.invalidUserId")}</div>
    );

  if (isLoading || !userInfo)
    return (
      <div className="h-full bg-[#121212] flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DB954]" />
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
        toast.success(t("profile.toast.updateSuccess"));
      } catch {
        toast.error(t("profile.toast.updateFailed"));
      } finally {
        setSavingProfile(false);
      }
    });
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans text-white pb-24">
      <div
        className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
      />
      <UserHero userInfo={displayUser} playlistCount={playlists.length} />
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">
        <UserActionBar
          isSelf={isSelf}
          onEdit={() => void requireLoginAction("profile-edit", () => setEditOpen(true))}
        />
        {isSelf && (
          <div className="px-6 mt-4">
            <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">
              {t("profile.page.recentSongs")}
            </h2>
            {recentSongs.length > 0 ? (
              <TracklistTable tracks={recentSongs} disableVirtualization hideDateColumn readonly />
            ) : (
              <div className="text-gray-400 text-sm py-4">{t("profile.page.noRecentSongs")}</div>
            )}
          </div>
        )}
        {isSelf && (
          <div className="px-6 mt-10">
            <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">
              {t("profile.page.recentPlaylists")}
            </h2>
            {recentPlaylists.length > 0 ? (
              <PublicPlaylistGrid
                playlists={recentPlaylists}
                onClickPlaylist={(id) => router.push(`/playlist?id=${id}`)}
              />
            ) : (
              <div className="text-gray-400 text-sm">{t("profile.page.noRecentPlaylists")}</div>
            )}
          </div>
        )}
        <div className="px-6 mt-10 mb-20">
          <button
            type="button"
            onClick={() => setPlaylistsOpen((v) => !v)}
            className="flex items-center gap-2 mb-6 group"
          >
            <h2 className="text-2xl font-bold group-hover:underline">
              {t("profile.page.publicPlaylists")}
            </h2>
            <ChevronUp
              className={cn(
                "w-5 h-5 text-zinc-400 transition-transform duration-200",
                playlistsOpen && "rotate-180",
              )}
            />
          </button>
          {playlistsOpen && (
            <PublicPlaylistGrid
              playlists={playlists}
              onClickPlaylist={(id) => router.push(`/playlist?id=${id}`)}
            />
          )}
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

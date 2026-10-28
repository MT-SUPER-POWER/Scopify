"use client";

import { Cloud } from "lucide-react";
import { useMemo, useState } from "react";
import { CloudDriveActions } from "@/components/library/CloudDriveActions";
import { CloudMatchDialog } from "@/components/library/CloudMatchDialog";
import { CloudStorageRing } from "@/components/library/CloudStorageRing";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { QuietState } from "@/components/shared/QuietState";
import { SidebarPlaylistConfirmDialog } from "@/components/Siderbar/SidebarPlaylistConfirmDialog";
import { CLOUD_SONG_FALLBACK_COVER } from "@/constants/cloud";
import { useCloudDrive } from "@/hooks/library/useCloudDrive";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/song/api";
import type { CloudTrackActions } from "@/types/components/library";
import type { PlaylistInfo } from "@/types/playlist";

const EMPTY_TRACKS: SongDetail[] = [];

export default function CloudDrivePage() {
  const { t } = useI18n();
  const { downloadTrack, isLoggedIn, matchTrack, query, removeTrack, uploadFiles, uploadProgress } =
    useCloudDrive();
  const [pendingRemoval, setPendingRemoval] = useState<SongDetail | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [matchTarget, setMatchTarget] = useState<SongDetail | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const tracks = query.data?.tracks ?? EMPTY_TRACKS;
  const maxSize = query.data?.maxSize ?? 0;
  const usedSize = query.data?.usedSize ?? 0;
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (query.isLoading) return null;

    return {
      cover: CLOUD_SONG_FALLBACK_COVER,
      createTime: "",
      creator: "",
      creatorAvatar: "",
      creatorID: null,
      isSpecial: true,
      likes: "",
      privacy: t("library.cloud.meta"),
      tags: [],
      title: t("library.title.cloud"),
      totalSongs: tracks.length,
    };
  }, [query.isLoading, t, tracks.length]);

  const cloudActions = useMemo<CloudTrackActions>(
    () => ({
      onDownload: (track) => void downloadTrack(track),
      onMatch: setMatchTarget,
      onRemove: setPendingRemoval,
      onUnmatch: (track) => void matchTrack(track, 0),
    }),
    [downloadTrack, matchTrack],
  );

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-surface-raised px-6 pt-8 pb-28 md:px-10">
        <QuietState icon={Cloud} title={t("library.loggedOut.cloud")} />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="min-h-screen bg-surface-raised px-6 pt-8 pb-28 md:px-10">
        <NetworkRetryState
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("network.action.refresh")}
          isRetrying={query.isRefetching}
          onRetry={() => void query.refetch()}
        />
      </main>
    );
  }

  const confirmMatch = async (adjustSongId: number) => {
    if (!matchTarget) return;
    setIsMatching(true);
    const matched = await matchTrack(matchTarget, adjustSongId);
    setIsMatching(false);
    if (matched) setMatchTarget(null);
  };

  const confirmRemoval = async () => {
    if (!pendingRemoval) return;
    setIsRemoving(true);
    await removeTrack(pendingRemoval);
    setIsRemoving(false);
    setPendingRemoval(null);
  };

  return (
    <>
      <PlaylistContent
        actionSlot={
          <CloudDriveActions
            onUpload={(files) => void uploadFiles(files)}
            uploadProgress={uploadProgress}
          />
        }
        contentSlot={
          tracks.length === 0
            ? () => (
                <QuietState
                  icon={Cloud}
                  title={t("library.empty.cloud.title")}
                  description={t("library.empty.cloud.description")}
                />
              )
            : undefined
        }
        dailyDate={null}
        dateColumnLabel={t("library.cloud.columnUploaded")}
        isDailyRecommend={false}
        isLoading={query.isLoading}
        cloudActions={cloudActions}
        playlistId={null}
        playlistInfo={playlistInfo}
        playSourceId="library:cloud"
        refetchTracks={query.refetch}
        themeColor="var(--scopify-page-accent-cloud)"
        trailingActionSlot={
          <CloudStorageRing maxSize={maxSize} songCount={tracks.length} usedSize={usedSize} />
        }
        tracks={tracks}
      />
      <CloudMatchDialog
        busy={isMatching}
        song={matchTarget}
        onClose={() => setMatchTarget(null)}
        onConfirm={(adjustSongId) => void confirmMatch(adjustSongId)}
      />
      <SidebarPlaylistConfirmDialog
        open={pendingRemoval !== null}
        busy={isRemoving}
        title={t("library.cloud.removeConfirm.title")}
        content={t("library.cloud.removeConfirm.content", { name: pendingRemoval?.name ?? "" })}
        confirmText={t("library.cloud.remove")}
        cancelText={t("common.action.cancel")}
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </>
  );
}

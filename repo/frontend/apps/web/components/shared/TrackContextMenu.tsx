"use client";

import { musicResourceKey } from "@scopify/music-domain/identity";
import { useQueryClient } from "@tanstack/react-query";
import {
  Disc3,
  Heart,
  ListPlus,
  MonitorPlay,
  MessageCircle,
  Pause,
  Play,
  PlusCircle,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useLibraryPlaylistsQuery } from "@/hooks/library/useLibraryPlaylists";
import { useTrackLikes } from "@/hooks/library/useLikedTracks";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { getCommentHref } from "@/lib/comment/commentResource";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

import type { PlayerTrack } from "@/types/player/model";

interface TrackContextMenuProps {
  children: ReactNode;
  track: PlayerTrack;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  /** The playlist the row is shown in, so adding there is not offered. */
  playlistId?: string | null;
  onRemoveFromPlaylist?: () => void;
  onRemoveFromQueue?: () => void;
  onOpenContextMenu?: () => void;
}

/**
 * The right-click menu of a track on a platform other than NetEase, which keeps its own richer
 * menu. Every entry shows only when the platform has what it needs.
 */
export function TrackContextMenu({
  children,
  track,
  isActive,
  isPlaying,
  onPlay,
  playlistId,
  onRemoveFromPlaylist,
  onRemoveFromQueue,
  onOpenContextMenu,
}: TrackContextMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <ContextMenu
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onOpenContextMenu?.();
      }}
    >
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      {open && (
        <TrackContextMenuContent
          track={track}
          isActive={isActive}
          isPlaying={isPlaying}
          onPlay={onPlay}
          playlistId={playlistId}
          onRemoveFromPlaylist={onRemoveFromPlaylist}
          onRemoveFromQueue={onRemoveFromQueue}
        />
      )}
    </ContextMenu>
  );
}

function TrackContextMenuContent({
  track,
  isActive,
  isPlaying,
  onPlay,
  playlistId,
  onRemoveFromPlaylist,
  onRemoveFromQueue,
}: Omit<TrackContextMenuProps, "children" | "onOpenContextMenu">) {
  const { t } = useTranslation();
  const provider = useActiveProvider();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useActiveAccount();
  const { isLiked } = useTrackLikes();
  const likeMutation = useSongLikeMutation();
  const library = useLibraryPlaylistsQuery();
  const { capabilities } = provider;

  const canLike = isLoggedIn && capabilities.has("track.like");
  const canManage = isLoggedIn && capabilities.has("playlist.manage");
  const canComment = capabilities.has("comments.read") && provider.commentTargetKinds.has("track");
  const liked = isLiked(track.ref);
  const ownPlaylists = (library.data ?? []).filter(
    (item) =>
      item.relation === "created" && !item.isLikedList && item.playlist.ref.id !== playlistId,
  );

  const addToQueue = () => {
    const state = usePlayerStore.getState();
    if (
      state.queue.some((queued) => musicResourceKey(queued.ref) === musicResourceKey(track.ref))
    ) {
      toast.info(t("playlist.table.queueExists"));
      return;
    }
    state.appendQueueItems([track]);
    toast.success(t("playlist.table.queueAdded"));
  };

  const toggleLike = async () => {
    try {
      await likeMutation.mutateAsync({ like: !liked, track: track.ref });
    } catch {
      // The mutation reports its own failure.
    }
  };

  const addToPlaylist = async (playlist: (typeof ownPlaylists)[number]["playlist"]) => {
    if (!provider.addPlaylistTracks) return;
    try {
      await provider.addPlaylistTracks(playlist.ref, [track.ref]);
      void queryClient.invalidateQueries({
        queryKey: musicQueryKeys.playlist.contentOf(playlist.ref.provider, playlist.ref.id),
      });
      void queryClient.invalidateQueries({
        queryKey: musicQueryKeys.library.playlistsAll(provider.provider),
      });
      toast.success(t("playlist.table.addToPlaylistSuccess"));
    } catch {
      toast.error(t("playlist.table.operationFailed"));
    }
  };

  const artists = track.artists.filter((artist) => artist.ref.id);

  return (
    <ContextMenuContent className="z-9999 w-56">
      <ContextMenuGroup>
        <ContextMenuItem onSelect={onPlay}>
          {isActive && isPlaying ? (
            <Pause className="mr-2 size-4" />
          ) : (
            <Play className="mr-2 size-4" />
          )}
          {t(isActive && isPlaying ? "contextMenu.pause" : "contextMenu.play")}
        </ContextMenuItem>
        {!onRemoveFromQueue && (
          <ContextMenuItem onSelect={addToQueue}>
            <ListPlus className="mr-2 size-4" />
            {t("contextMenu.addToQueue")}
          </ContextMenuItem>
        )}
        {onRemoveFromQueue && (
          <ContextMenuItem onSelect={onRemoveFromQueue}>
            <Trash2 className="mr-2 size-4" />
            {t("contextMenu.removeFromQueue")}
          </ContextMenuItem>
        )}
        {canLike && (
          <ContextMenuItem onSelect={() => void toggleLike()}>
            <Heart className="mr-2 size-4" />
            {t(liked ? "contextMenu.removeFromLiked" : "contextMenu.addToLiked")}
          </ContextMenuItem>
        )}
        {canManage && provider.addPlaylistTracks && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <PlusCircle className="mr-4 size-4" />
              {t("contextMenu.addToPlaylist")}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="z-9999 scrollbar-thin max-h-72 max-w-80 overflow-y-auto">
              {ownPlaylists.length === 0 && (
                <ContextMenuItem disabled>{t("song.similar.noPlaylists")}</ContextMenuItem>
              )}
              {ownPlaylists.map(({ playlist }) => (
                <ContextMenuItem
                  key={playlist.ref.id}
                  onSelect={() => void addToPlaylist(playlist)}
                >
                  {playlist.coverUrl && (
                    <img
                      width={28}
                      height={28}
                      src={getSizedImageUrl(playlist.coverUrl, 80)}
                      alt=""
                      className="mr-2 size-7 rounded-sm object-cover"
                    />
                  )}
                  <span className="truncate">{playlist.title}</span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        {canComment && (
          <ContextMenuItem asChild className="w-full">
            <Link href={getCommentHref("song", track.ref.id)} className="block size-full">
              <MessageCircle className="mr-2 size-4" />
              {t("contextMenu.comments")}
            </Link>
          </ContextMenuItem>
        )}
        {capabilities.has("mv") && track.mvId && (
          <ContextMenuItem asChild className="w-full">
            <Link href={`/mv?id=${track.mvId}`} className="block size-full">
              <MonitorPlay className="mr-2 size-4" />
              MV
            </Link>
          </ContextMenuItem>
        )}
        {capabilities.has("artist.read") && artists.length === 1 && (
          <ContextMenuItem asChild className="w-full">
            <Link href={`/artist?id=${artists[0].ref.id}`} className="block size-full">
              <User className="mr-2 size-4" />
              {t("contextMenu.goToArtist")}
            </Link>
          </ContextMenuItem>
        )}
        {capabilities.has("artist.read") && artists.length > 1 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <User className="mr-4 size-4" />
              {t("contextMenu.goToArtist")}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="z-9999">
              {artists.map((artist) => (
                <ContextMenuItem key={artist.ref.id} asChild>
                  <Link href={`/artist?id=${artist.ref.id}`} className="block size-full">
                    {artist.name}
                  </Link>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        {capabilities.has("album.read") && track.album?.ref.id && (
          <ContextMenuItem asChild className="w-full">
            <Link href={`/album?id=${track.album.ref.id}`} className="block size-full">
              <Disc3 className="mr-2 size-4" />
              {t("contextMenu.goToAlbum")}
            </Link>
          </ContextMenuItem>
        )}
      </ContextMenuGroup>
      {onRemoveFromPlaylist && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={onRemoveFromPlaylist}>
            <Trash2 className="mr-2 size-4" />
            {t("contextMenu.removeFromPlaylist")}
          </ContextMenuItem>
        </>
      )}
    </ContextMenuContent>
  );
}

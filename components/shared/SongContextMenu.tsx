"use client";

import { Ban, Heart, Link2, ListPlus, Pause, Play, PlusCircle, Trash, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { FaRegCommentDots } from "react-icons/fa6";
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
import { likeSong } from "@/lib/api/playlist";
import { updatePlaylistTrack } from "@/lib/api/track";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { NeteasePlaylist } from "@/types/api/playlist";

interface SongContextMenuProps {
  song: SongDetail;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemoveFromQueue?: () => void;
  onRemoveFromPlaylist?: () => void;
  onDislikeDailyRecommend?: () => void;
  playlistID?: string | null;
  isDailyRecommend?: boolean;
  readonly?: boolean;
  children: React.ReactNode;
}

export function SongContextMenu({
  song,
  isActive,
  isPlaying,
  onPlay,
  onRemoveFromQueue,
  onRemoveFromPlaylist,
  onDislikeDailyRecommend,
  playlistID,
  isDailyRecommend = false,
  readonly = false,
  children,
}: SongContextMenuProps) {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const playlists = useUserStore((s) => s.playlist);
  const likelist = useUserStore((s) => s.likeListIDs);

  const isLiked = useMemo(() => {
    if (Array.isArray(likelist)) return likelist.includes(song.id);
    return false;
  }, [likelist, song.id]);

  const filteredPlaylists = useMemo(
    () => playlists.filter((p: NeteasePlaylist) => String(p.id) !== String(playlistID)),
    [playlists, playlistID],
  );

  const handleLike = useCallback(
    async (e: React.MouseEvent | Event) => {
      e.stopPropagation();
      const nextLiked = !isLiked;
      try {
        await likeSong(song.id, nextLiked);
        const store = useUserStore.getState();
        const current = Array.isArray(store.likeListIDs) ? store.likeListIDs : [];
        store.setLikeListIDs(
          nextLiked ? [...current, song.id] : current.filter((id: number) => id !== song.id),
        );
        void clearPageCache();
        toast.success(
          nextLiked ? t("playlist.track.likedAdded") : t("playlist.track.likedRemoved"),
        );
        if (store.triggerLibraryUpdate) store.triggerLibraryUpdate();
      } catch (_err) {
        toast.error(t("playlist.table.operationFailed"));
      }
    },
    [song.id, isLiked, t],
  );

  const handleAddToQueue = useCallback(() => {
    const state = usePlayerStore.getState();
    const alreadyInQueue = state.queue.some((t) => t.id === song.id);
    if (alreadyInQueue) {
      toast.info(t("playlist.table.queueExists"));
      return;
    }
    state.setQueue([...state.queue, song], state.queueIndex);
    toast.success(t("playlist.table.queueAdded"));
  }, [song, t]);

  const handleCopyLink = useCallback(() => {
    const href = `https://music.163.com/#/song?id=${song.id}`;
    navigator.clipboard
      .writeText(href)
      .then(() => toast.success(t("playlist.table.copySuccess")))
      .catch(() => toast.error(t("playlist.table.copyFailed")));
  }, [song.id, t]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-48 bg-[#282828] text-white border-white/10 z-9999">
        <ContextMenuGroup>
          <ContextMenuItem onClick={onPlay} className="focus:bg-white/10 focus:text-white">
            {isActive && isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                {t("contextMenu.pause")}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {t("contextMenu.play")}
              </>
            )}
          </ContextMenuItem>

          {isLogin && (
            <>
              {/* Add to Queue (If not already in queue/table context) */}
              {!onRemoveFromQueue && (
                <ContextMenuItem
                  className="focus:bg-white/10 focus:text-white"
                  onClick={handleAddToQueue}
                >
                  <ListPlus className="w-4 h-4 mr-2" />
                  {t("contextMenu.addToQueue")}
                </ContextMenuItem>
              )}

              <ContextMenuItem className="focus:bg-white/10 focus:text-white" onClick={handleLike}>
                <Heart className="w-4 h-4 mr-2" />
                {isLiked ? t("contextMenu.removeFromLiked") : t("contextMenu.addToLiked")}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuGroup>

        <ContextMenuSeparator className="bg-white/10" />

        <ContextMenuGroup>
          {isLogin && (
            <ContextMenuSub>
              <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                <PlusCircle className="w-4 h-4 mr-4" />
                {t("contextMenu.addToPlaylist")}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-[#282828] text-white border-white/10 z-9999">
                {filteredPlaylists.map((playlist: NeteasePlaylist) => (
                  <ContextMenuItem
                    onClick={async () => {
                      try {
                        await updatePlaylistTrack("add", playlist.id, song.id);
                        toast.success(t("playlist.table.addToPlaylistSuccess"));
                        void clearPageCache();
                        const store = useUserStore.getState();
                        if (store.triggerLibraryUpdate) store.triggerLibraryUpdate();
                      } catch (_err) {
                        toast.error(t("playlist.table.addToPlaylistFailed"));
                      }
                    }}
                    key={playlist.id}
                    className="focus:bg-white/10 focus:text-white"
                  >
                    <Image
                      width={28}
                      height={28}
                      src={playlist.coverImgUrl}
                      alt={t("playlist.form.coverAlt")}
                      className="w-7 h-7 rounded-sm mr-2"
                    />
                    {playlist.name}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
            <Link
              href={song.id ? `/comment/?songId=${song.id}` : "#"}
              className="w-full h-full block focus:bg-white/10 focus:text-white"
            >
              <FaRegCommentDots className="w-4 h-4 mr-2" />
              {t("contextMenu.comments")}
            </Link>
          </ContextMenuItem>

          {song.ar &&
            song.ar.length > 0 &&
            (song.ar.length === 1 ? (
              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <Link
                  href={`/artist?id=${song.ar[0].id}`}
                  className="w-full h-full block focus:bg-white/10 focus:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  {t("contextMenu.goToArtist")}
                </Link>
              </ContextMenuItem>
            ) : (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                  <User className="w-4 h-4 mr-4" />
                  {t("contextMenu.goToArtist")}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="bg-[#282828] text-white border-white/10 z-9999">
                  {song.ar.map((artist) => (
                    <ContextMenuItem
                      key={artist.id}
                      asChild
                      className="focus:bg-white/10 focus:text-white"
                    >
                      <Link href={`/artist?id=${artist.id}`} className="w-full h-full block">
                        {artist.name}
                      </Link>
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            ))}

          <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full h-full block focus:bg-white/10 focus:text-white text-left"
            >
              <Link2 className="w-4 h-4 mr-2" />
              {t("contextMenu.copyLink")}
            </button>
          </ContextMenuItem>
        </ContextMenuGroup>

        {/* Queue removal */}
        {onRemoveFromQueue && (
          <>
            <ContextMenuSeparator className="bg-white/10" />
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={onRemoveFromQueue}
                variant="destructive"
                className="focus:bg-red-500 focus:text-white"
              >
                <Trash className="w-4 h-4 mr-2" />
                {t("contextMenu.removeFromQueue")}
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}

        {/* Playlist removal */}
        {isLogin && !readonly && !isDailyRecommend && onRemoveFromPlaylist && (
          <>
            <ContextMenuSeparator className="bg-white/10" />
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={onRemoveFromPlaylist}
                variant="destructive"
                className="focus:bg-red-500 focus:text-white"
              >
                <Trash className="w-4 h-4 mr-2" />
                {t("contextMenu.removeFromPlaylist")}
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}

        {/* Daily recommendation dislike */}
        {isDailyRecommend && isLogin && onDislikeDailyRecommend && (
          <>
            <ContextMenuSeparator className="bg-white/10" />
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={onDislikeDailyRecommend}
                variant="destructive"
                className="focus:bg-red-500 focus:text-white"
              >
                <Ban className="w-4 h-4 mr-2" />
                {t("contextMenu.recommendLess")}
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

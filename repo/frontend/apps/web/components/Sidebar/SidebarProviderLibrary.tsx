"use client";

import type { MusicLibraryPlaylist } from "@scopify/music-domain/library";
import { Eye, ListMusic, LogIn, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useLibraryPlaylistActions } from "@/hooks/library/useLibraryPlaylistActions";
import { useLibraryPlaylistsQuery } from "@/hooks/library/useLibraryPlaylists";
import { useLikedTrackIdsQuery } from "@/hooks/library/useLikedTracks";
import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";

import type { SidebarPlaylistLibraryContentProps } from "@/types/sidebar/components";
import { CollapsibleLibraryGroup } from "./CollapsibleLibraryGroup";
import { LibraryItem } from "./LibraryItem";
import { PersonalFmPlaylistItem } from "./PersonalFmPlaylistItem";
import { SidebarLibraryStateCard } from "./SidebarLibraryStateCard";
import { SidebarPlaylistConfirmDialog } from "./SidebarPlaylistConfirmDialog";
import { SidebarPlaylistSkeleton } from "./SidebarPlaylistSkeleton";

/** A one-pixel transparent image for a playlist the platform gave no cover. */
const NO_COVER = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

function coverOf(url: string | null) {
  return getSizedImageUrl(url, 100) || NO_COVER;
}

function PlaylistMenu({ item, children }: { item: MusicLibraryPlaylist; children: ReactNode }) {
  const { t } = useTranslation();
  const smartRouter = useSmartRouter();
  const canManage = useProviderCapability("playlist.manage");
  const { remove, subscribe } = useLibraryPlaylistActions();
  const [confirming, setConfirming] = useState(false);
  const { playlist } = item;
  const unsubscribe = item.relation === "subscribed";
  const busy = remove.isPending || subscribe.isPending;

  const confirm = async () => {
    try {
      if (unsubscribe) {
        await subscribe.mutateAsync({ playlist: playlist.ref, subscribed: false });
        toast.success(t("playlist.actions.unsubscribeSuccess"));
      } else {
        await remove.mutateAsync(playlist.ref);
        toast.success(t("sidebar.menu.deleteSuccess", { name: playlist.title }));
      }
      setConfirming(false);
    } catch {
      toast.error(
        unsubscribe ? t("sidebar.lib.unsubscribeFailed") : t("sidebar.menu.deleteFailed"),
      );
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => smartRouter.push(`/playlist/?id=${playlist.ref.id}`)}>
            <Eye className="mr-2 size-4" />
            {t("contextMenu.view")}
          </ContextMenuItem>
          {canManage && (
            <ContextMenuItem
              disabled={busy}
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                setConfirming(true);
              }}
            >
              <Trash2 className="mr-2 size-4" />
              {unsubscribe ? t("playlist.actions.unsubscribe") : t("contextMenu.deletePlaylist")}
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <SidebarPlaylistConfirmDialog
        open={confirming}
        title={
          unsubscribe ? t("playlist.actions.unsubscribe") : t("sidebar.lib.deleteConfirmTitle")
        }
        content={t(
          unsubscribe
            ? "sidebar.lib.unsubscribeConfirmContent"
            : "sidebar.lib.deleteConfirmContent",
          { name: playlist.title || t("sidebar.lib.untitledPlaylist") },
        )}
        confirmText={t("common.action.confirm")}
        cancelText={t("common.action.cancel")}
        onConfirm={confirm}
        onCancel={() => {
          if (!busy) setConfirming(false);
        }}
        busy={busy}
      />
    </>
  );
}

/**
 * The library of a platform without NetEase's playlist ordering and drop targets: the liked
 * list, then the playlists the account created and saved, read through the library source.
 */
export function SidebarProviderLibrary({
  isCollapsed,
  onLogin,
  onCreate,
}: SidebarPlaylistLibraryContentProps) {
  const { t } = useTranslation();
  const { account } = useLibraryAccount();
  const query = useLibraryPlaylistsQuery(true);
  const canManage = useProviderCapability("playlist.manage");
  // Starts the liked IDs the like buttons read.
  useLikedTrackIdsQuery();

  if (!account) {
    return (
      <SidebarLibraryStateCard
        isCollapsed={isCollapsed}
        icon={LogIn}
        title={t("sidebar.card.loginTitle")}
        subtitle={t("sidebar.card.loginSubtitle")}
        actionLabel={t("common.action.login")}
        onAction={onLogin}
      />
    );
  }
  if (query.data === undefined && query.error) throw query.error;
  if (query.data === undefined && query.fetchStatus === "paused") {
    return (
      <SidebarLibraryStateCard
        isCollapsed={isCollapsed}
        icon={WifiOff}
        title={t("sidebar.card.waitingForNetwork")}
        subtitle={t("sidebar.card.reconnectHint")}
      />
    );
  }
  if (query.data === undefined) {
    return (
      <div role="status" aria-label={t("sidebar.card.loading")}>
        <SidebarPlaylistSkeleton isCollapsed={isCollapsed} />
      </div>
    );
  }

  const liked = query.data.find((item) => item.isLikedList);
  const others = query.data.filter((item) => !item.isLikedList);
  const created = others.filter((item) => item.relation === "created");
  const subscribed = others.filter((item) => item.relation === "subscribed");
  const renderItem = (item: MusicLibraryPlaylist) => (
    <PlaylistMenu key={item.playlist.ref.id} item={item}>
      <div className="group relative rounded-md">
        <LibraryItem
          id={item.playlist.ref.id}
          hasContextMenu={false}
          title={item.playlist.title}
          subtitle={t("sidebar.playlist.byCreator", {
            name: item.playlist.creator?.name || t("common.meta.unknownUser"),
          })}
          coverImg={coverOf(item.playlist.coverUrl)}
          isCollapsed={isCollapsed}
        />
      </div>
    </PlaylistMenu>
  );
  const personal = (
    <>
      <PersonalFmPlaylistItem isCollapsed={isCollapsed} />
      {liked && (
        <LibraryItem
          id={liked.playlist.ref.id}
          href="/liked"
          hasContextMenu={false}
          title={t("sidebar.library.likedMusic")}
          subtitle={t("sidebar.playlist.you")}
          coverImg={coverOf(liked.playlist.coverUrl)}
          isCollapsed={isCollapsed}
        />
      )}
    </>
  );

  return (
    <>
      {query.error && (
        <div
          role="status"
          className="flex items-center justify-center gap-1 px-2 py-1 text-xs text-content-muted"
        >
          <Button
            variant="ghost"
            size="sm"
            title={t("sidebar.card.refreshFailed")}
            aria-label={t("sidebar.card.refreshFailed")}
            onClick={() => void query.refetch()}
            className="h-auto min-w-0 gap-1 p-1 text-xs"
          >
            <RefreshCw aria-hidden className="size-3.5 shrink-0" />
            {!isCollapsed && t("sidebar.card.refreshFailed")}
          </Button>
        </div>
      )}
      {isCollapsed ? (
        personal
      ) : (
        <CollapsibleLibraryGroup title={t("sidebar.group.personal")}>
          {personal}
        </CollapsibleLibraryGroup>
      )}
      {others.length === 0 ? (
        <SidebarLibraryStateCard
          isCollapsed={isCollapsed}
          icon={ListMusic}
          title={t("sidebar.card.noPlaylistsTitle")}
          subtitle={t("sidebar.card.noPlaylistsSubtitle")}
          actionLabel={canManage ? t("sidebar.menu.createPlaylist") : undefined}
          onAction={canManage ? onCreate : undefined}
        />
      ) : isCollapsed ? (
        <>
          {created.map(renderItem)}
          {subscribed.map(renderItem)}
        </>
      ) : (
        <>
          <CollapsibleLibraryGroup title={t("sidebar.group.created")} defaultOpen>
            {created.map(renderItem)}
          </CollapsibleLibraryGroup>
          <CollapsibleLibraryGroup title={t("sidebar.group.subscribed")} defaultOpen>
            {subscribed.map(renderItem)}
          </CollapsibleLibraryGroup>
        </>
      )}
    </>
  );
}

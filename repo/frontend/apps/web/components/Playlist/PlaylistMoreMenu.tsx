"use client";

import { Edit, Link, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdatePlaylistDialog } from "@/components/Playlist/PlaylistForm";
import { usePlaylistManagement } from "@/hooks/playlist/usePlaylistManagement";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistMoreMenuProps } from "@/types/components/playlist";

export function PlaylistMoreMenu({ playlistId, playlistInfo, isSticky }: PlaylistMoreMenuProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const management = usePlaylistManagement(playlistId, {
    id: Number(playlistId),
    name: playlistInfo.title,
    description: playlistInfo.description,
    coverImgUrl: playlistInfo.cover ?? undefined,
    tags: playlistInfo.tags,
    specialType: playlistInfo.specialType,
    creator: { userId: Number(playlistInfo.creatorID) || undefined },
    subscribed: playlistInfo.subscribed,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("playlist.actions.more")}
            title={t("playlist.actions.more")}
            className="inline-flex cursor-pointer items-center justify-center rounded-sm text-content-muted transition-colors outline-none hover:text-content focus-visible:ring-2 focus-visible:ring-brand"
          >
            <MoreHorizontal className={cn(isSticky ? "size-7" : "size-8")} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="w-48">
          {management.canManage && (
            <DropdownMenuItem disabled={management.busy} onSelect={() => setEditing(true)}>
              <Edit className="size-4" />
              {t("contextMenu.updatePlaylist")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard
                .writeText(`https://music.163.com/#/playlist?id=${playlistId}`)
                .then(() => toast.success(t("sidebar.lib.playlistLinkCopied")))
                .catch(() => toast.error(t("playlist.table.operationFailed")));
            }}
          >
            <Link className="size-4" />
            {t("contextMenu.copyPlaylistLink")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editing && management.canManage && (
        <UpdatePlaylistDialog
          open
          initialData={management.playlist}
          onConfirm={async (data) => {
            if (await management.update(data)) setEditing(false);
          }}
          onCancel={() => {
            if (!management.busy) setEditing(false);
          }}
        />
      )}
    </>
  );
}

"use client";

import { Edit, Trash } from "lucide-react";
import { useState } from "react";
import { UpdatePlaylistDialog } from "@/components/Playlist/PlaylistForm";
import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { usePlaylistManagement } from "@/hooks/playlist/usePlaylistManagement";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistManagementProps } from "@/types/components/sidebar";
import { SidebarPlaylistConfirmDialog } from "./SidebarPlaylistConfirmDialog";

export function SidebarPlaylistManagement({
  children,
  playlistId,
}: SidebarPlaylistManagementProps) {
  const { t } = useI18n();
  const management = usePlaylistManagement(playlistId);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState<"delete" | "unsubscribe" | null>(null);
  const unsubscribe = confirming === "unsubscribe";

  const actions =
    management.canManage || management.canUnsubscribe ? (
      <>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          {management.canManage && (
            <ContextMenuItem disabled={management.busy} onSelect={() => setEditing(true)}>
              <Edit className="mr-2 size-4" />
              {t("contextMenu.updatePlaylist")}
            </ContextMenuItem>
          )}
          <ContextMenuItem
            disabled={management.busy}
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setConfirming(management.canManage ? "delete" : "unsubscribe");
            }}
          >
            <Trash className="mr-2 size-4" />
            {management.canManage
              ? t("contextMenu.deletePlaylist")
              : t("playlist.actions.unsubscribe")}
          </ContextMenuItem>
        </ContextMenuGroup>
      </>
    ) : null;

  return (
    <>
      {children(actions)}
      <SidebarPlaylistConfirmDialog
        open={
          confirming !== null && (unsubscribe ? management.canUnsubscribe : management.canManage)
        }
        title={
          unsubscribe ? t("playlist.actions.unsubscribe") : t("sidebar.lib.deleteConfirmTitle")
        }
        content={t(
          unsubscribe
            ? "sidebar.lib.unsubscribeConfirmContent"
            : "sidebar.lib.deleteConfirmContent",
          {
            name: management.playlist?.name ?? t("sidebar.lib.untitledPlaylist"),
          },
        )}
        confirmText={t("common.action.confirm")}
        cancelText={t("common.action.cancel")}
        onConfirm={async () => {
          if (await management.remove(unsubscribe)) setConfirming(null);
        }}
        onCancel={() => {
          if (!management.busy) setConfirming(null);
        }}
        busy={management.busy}
      />
      {editing && management.canManage && (
        <UpdatePlaylistDialog
          open={editing && management.canManage}
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

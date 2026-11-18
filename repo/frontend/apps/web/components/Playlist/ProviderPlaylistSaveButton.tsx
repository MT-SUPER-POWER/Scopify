"use client";

import { toast } from "sonner";
import { CollectionToggleButton } from "@/components/shared/CollectionToggleButton";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { useLibraryPlaylistActions } from "@/hooks/library/useLibraryPlaylistActions";
import { useLibraryPlaylistsQuery } from "@/hooks/library/useLibraryPlaylists";
import { useActiveProvider, useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { useTranslation } from "react-i18next";

/**
 * The heart of someone else's playlist on platforms other than NetEase: filled when the account
 * saved it, a click saves or unsaves it. Nothing shows for the account's own playlists.
 */
export function ProviderPlaylistSaveButton({ playlistId }: { playlistId: string }) {
  const { t } = useTranslation();
  const provider = useActiveProvider();
  const canManage = useProviderCapability("playlist.manage");
  const library = useLibraryPlaylistsQuery();
  const { subscribe } = useLibraryPlaylistActions();
  const requireLogin = useRequireLoginAction();

  const entry = library.data?.find((item) => item.playlist.ref.id === playlistId);
  if (!canManage || !provider.setPlaylistSubscribed || entry?.relation === "created") return null;
  const saved = entry?.relation === "subscribed";

  const toggle = () =>
    void requireLogin(async () => {
      try {
        await subscribe.mutateAsync({
          playlist: { provider: provider.provider, kind: "playlist", id: playlistId },
          subscribed: !saved,
        });
        toast.success(
          t(saved ? "playlist.actions.unsubscribeSuccess" : "playlist.actions.subscribeSuccess"),
        );
      } catch {
        toast.error(t("playlist.table.operationFailed"));
      }
    });

  return (
    <CollectionToggleButton
      isCollected={saved}
      isLoading={subscribe.isPending}
      onToggle={toggle}
      subscribeLabel={t("playlist.actions.subscribe")}
      unsubscribeLabel={t("playlist.actions.unsubscribe")}
    />
  );
}

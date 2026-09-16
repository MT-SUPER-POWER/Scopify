"use client";

import { useMemo } from "react";
import { SortableList } from "@/components/shared/SortableList";
import { DragThumbnail } from "@/components/shared/DragThumbnail";
import { useInlinePlaylistOrder } from "@/hooks/playlist/useInlinePlaylistOrder";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SidebarSortablePlaylistsProps } from "@/types/components/sidebar";
import type { NeteasePlaylist } from "@/types/api/playlist";
import { CollapsibleLibraryGroup } from "./CollapsibleLibraryGroup";
import { SortableLibraryItem } from "./SortableLibraryItem";

export function SidebarSortablePlaylists({
  playlists,
  isCollapsed,
}: SidebarSortablePlaylistsProps) {
  const { t } = useI18n();
  const userId = useUserStore((state) => state.user?.userId);
  const grouped = useMemo(
    () =>
      [...playlists].sort(
        (a, b) => Number(a.creator.userId !== userId) - Number(b.creator.userId !== userId),
      ),
    [playlists, userId],
  );
  const order = useInlinePlaylistOrder(grouped);
  const created = order.items.filter(
    (item) => item.specialType !== 5 && item.creator.userId === userId,
  );
  const subscribed = order.items.filter(
    (item) => item.specialType !== 5 && item.creator.userId !== userId,
  );
  const itemProps = (playlist: NeteasePlaylist) => ({
    id: playlist.id,
    title: playlist.name,
    isCollapsed,
    subtitle: t("sidebar.playlist.byCreator", {
      name: playlist.creator.nickname || t("common.meta.unknownUser"),
    }),
    coverImg: `${playlist.coverImgUrl}?param=100y100`,
  });
  const renderItems = (items: NeteasePlaylist[]) =>
    items.map((playlist) => (
      <SortableLibraryItem
        key={playlist.id}
        {...itemProps(playlist)}
        locked={playlist.specialType === 5}
        playlist={playlist}
      />
    ));
  return (
    <SortableList
      ids={order.items.map((item) => item.id)}
      disabled={!userId}
      busy={order.isSaving}
      canMove={(from, to) => {
        const source = order.items[from];
        const target = order.items[to];
        if (!source || !target || source.specialType === 5 || target.specialType === 5)
          return false;
        const own = source.creator.userId === userId;
        return order.items
          .slice(Math.min(from, to), Math.max(from, to) + 1)
          .every((item) => item.specialType !== 5 && (item.creator.userId === userId) === own);
      }}
      onMove={order.move}
      renderOverlay={(id) => {
        const item = order.items.find((playlist) => playlist.id === id);
        return item ? (
          <DragThumbnail
            cover={item.coverImgUrl}
            title={item.name}
            subtitle={item.creator.nickname}
          />
        ) : null;
      }}
    >
      {isCollapsed ? (
        <>
          {renderItems(created)}
          {renderItems(subscribed)}
        </>
      ) : (
        <>
          <CollapsibleLibraryGroup title={t("sidebar.group.created")} defaultOpen>
            {renderItems(created)}
          </CollapsibleLibraryGroup>
          <CollapsibleLibraryGroup title={t("sidebar.group.subscribed")} defaultOpen>
            {renderItems(subscribed)}
          </CollapsibleLibraryGroup>
        </>
      )}
    </SortableList>
  );
}
